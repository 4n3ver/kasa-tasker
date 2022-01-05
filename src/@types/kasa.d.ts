interface Device {
    deviceType: string;
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

interface SetRelayStateResult {
    set_relay_state: PassthroughResult;
}

interface PassthroughResponseData<T> {
    system: T;
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
