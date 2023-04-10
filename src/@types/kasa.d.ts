type DeviceType = "IOT.SMARTBULB" | "IOT.SMARTPLUGSWITCH";

interface Device {
    deviceType: DeviceType;
    deviceId: string;
    alias: string;
    appServerUrl: string;
}

interface DeviceList {
    deviceList: ReadonlyArray<Device>;
}


interface AuthToken {
    accountId: string;
    regTime: string;
    countryCode: string;
    token: string;
}


interface PassthroughResult {
    err_code: number;
}

interface LightState {
    brightness: number;
    hue: number;
    saturation: number;
    color_temp: number;
    on_off: 0 | 1;
    mode: "normal"
}

interface SetRelayStateResult {
    system: {
        set_relay_state: PassthroughResult;
    };
}

interface TransitionLightStateResult {
    "smartlife.iot.smartbulb.lightingservice": {
        transition_light_state: LightState & PassthroughResult
    };
}

interface PassthroughResponse {
    responseData: string;
}


interface OkResult<T> {
    error_code: 0;
    result: T;
}

interface ErrorResult {
    error_code: number;
    msg: string;
}

type Result<T> =
    | OkResult<T>
    | ErrorResult;
