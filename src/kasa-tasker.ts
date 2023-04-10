enum DeviceState {
    OFF = "OFF",
    ON = "ON"
}

function isOkResult(body: unknown): body is OkResult<unknown> {
    return (body as Result<unknown>)?.error_code === 0
        && !!(body as OkResult<unknown>).result
        && !(body as ErrorResult).msg;
}

function isOkLoginResult(body: unknown): body is OkResult<AuthToken> {
    return isOkResult(body) && !!(body.result as AuthToken).token;
}

function isOkDeviceListResult(body: unknown): body is OkResult<DeviceList> {
    return isOkResult(body) && !!(body.result as DeviceList).deviceList;
}

function isOkSetRelayResult(body: unknown): body is OkResult<PassthroughResponse> {
    if (isOkResult(body) && !!(body.result as PassthroughResponse).responseData) {
        const response = JSON.parse(
            (body.result as PassthroughResponse).responseData
        ) as SetRelayStateResult;
        const responseData = response?.system;
        return responseData?.set_relay_state?.err_code === 0;
    } else {
        return false;
    }
}

function isOkTransitionLightResult(body: unknown): body is OkResult<PassthroughResponse> {
    if (isOkResult(body) && !!(body.result as PassthroughResponse).responseData) {
        const response = JSON.parse(
            (body.result as PassthroughResponse).responseData
        ) as TransitionLightStateResult;
        const responseData = response && response["smartlife.iot.smartbulb.lightingservice"];
        return responseData?.transition_light_state?.err_code === 0;
    } else {
        return false;
    }
}

const buildQueries: (params: Record<string, string>) => string =
    params => Object.entries(params)
        .map(([key, val]) => `${key}=${val}`)
        .join("&");

const returnOk: () => void =
    () => setLocal("kasaok", "1");

const returnError: (err: Error) => void =
    err => setLocal("kasaerror", `Failed with: ${err.stack || err}}`);

class Kasa {
    readonly #username: string;
    readonly #password: string;

    #token?: string;
    #deviceList?: ReadonlyArray<Device>;

    constructor(username: string, password: string) {
        this.#username = username;
        this.#password = password;
    }

    async login() {
        const resp = await fetch("https://wap.tplinkcloud.com", {
            method: "POST",
            body: JSON.stringify({
                method: "login",
                params: {
                    appType: "Kasa_Android",
                    cloudUserName: this.#username,
                    cloudPassword: this.#password,
                    terminalUUID: "c39f7337-a17b-41a3-b5e4-0f34860a700f"
                }
            })
        });
        const body = await resp.json() as unknown;

        if (isOkLoginResult(body)) {
            this.#token = body.result.token;
            await this.refreshDeviceList();
            return;
        }

        throw new Error(`Unexpected response ${JSON.stringify(body, null, 2)}`);
    }

    async refreshDeviceList() {
        if (!this.#token) {
            await this.login();
        }

        const resp = await fetch(`https://wap.tplinkcloud.com?token=${this.#token!}`, {
            method: "POST",
            body: JSON.stringify({
                method: "getDeviceList"
            })
        });
        const body = await resp.json() as unknown;

        if (isOkDeviceListResult(body)) {
            this.#deviceList = body.result.deviceList;
            return;
        }

        throw new Error(`Unexpected response ${JSON.stringify(body, null, 2)}`);
    }

    async turnOn(deviceAlias: string) {
        await this.setDeviceState(deviceAlias, DeviceState.ON);
    }

    async turnOff(deviceAlias: string) {
        await this.setDeviceState(deviceAlias, DeviceState.OFF);
    }

    async setDeviceState(deviceAlias: string, state: DeviceState) {
        const device = await this.findDevice(deviceAlias);
        switch (device.deviceType) {
            case "IOT.SMARTBULB":
                return await this.transitionLightState(device, state);
            case "IOT.SMARTPLUGSWITCH":
                return await this.setRelayState(device, state);
        }
    }

    private async findDevice(deviceAlias: string): Promise<Device> {
        if (!this.#deviceList) {
            await this.refreshDeviceList();
        }

        const device = this.#deviceList!.find(d => d.alias === deviceAlias);
        if (device) {
            return device;
        }

        throw new Error(`Device with alias ${deviceAlias} could not be found!`);
    }

    private async setRelayState(device: Device, state: DeviceState) {
        if (!this.#token) {
            await this.login();
        }

        const {
            appServerUrl,
            deviceId
        } = device;

        const params = {
            token: this.#token!,
            appName: "Kasa_Android",
            termID: "c39f7337-a17b-41a3-b5e4-0f34860a700f",
            appVer: "1.4.4.607",
            ospf: "Android+6.0.1",
            netType: "wifi",
            locale: "en_US HTTP/1.1"
        };

        const resp = await fetch(`${appServerUrl}?${buildQueries(params)}`, {
            method: "POST",
            body: JSON.stringify({
                method: "passthrough",
                params: {
                    deviceId,
                    requestData: JSON.stringify({
                        system: {
                            set_relay_state: {
                                state: state === DeviceState.ON
                                    ? 1
                                    : 0
                            }
                        }
                    })
                }
            })
        });
        const body = await resp.json() as unknown;

        if (isOkSetRelayResult(body)) {
            return;
        }

        throw new Error(`Unexpected response ${JSON.stringify(body, null, 2)}`);
    }

    private async transitionLightState(device: Device, state: DeviceState) {
        if (!this.#token) {
            await this.login();
        }

        const {
            appServerUrl,
            deviceId
        } = device;

        const params = {
            token: this.#token!,
            appName: "Kasa_Android",
            termID: "c39f7337-a17b-41a3-b5e4-0f34860a700f",
            appVer: "1.4.4.607",
            ospf: "Android+6.0.1",
            netType: "wifi",
            locale: "en_US HTTP/1.1"
        };

        const resp = await fetch(`${appServerUrl}?${buildQueries(params)}`, {
            method: "POST",
            body: JSON.stringify({
                method: "passthrough",
                params: {
                    deviceId,
                    requestData: JSON.stringify({
                        "smartlife.iot.smartbulb.lightingservice": {
                            "transition_light_state": {
                                "on_off": state === DeviceState.ON
                            }
                        }
                    })
                }
            })
        });
        const body = await resp.json() as unknown;

        if (isOkTransitionLightResult(body)) {
            return;
        }

        throw new Error(`Unexpected response ${JSON.stringify(body, null, 2)}`);
    }
}

const kasa = new Kasa(kasausername, kasapassword);
kasa.login()
    .then(() => kasa.setDeviceState(devicealias, devicestate))
    .then(returnOk)
    .catch(returnError)
    .finally(exit);
