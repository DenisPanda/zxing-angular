import { __awaiter } from "tslib";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { BrowserCodeReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatContinuousReader } from './browser-multi-format-continuous-reader';
export class ZXingScannerComponent {
    /**
     * Constructor to build the object and do some DI.
     */
    constructor() {
        /**
         * Delay between attempts to decode (default is 500ms)
         */
        this.timeBetweenScans = 500;
        /**
         * Delay between successful decode (default is 500ms)
         */
        this.delayBetweenScanSuccess = 500;
        /**
         * How the preview element shoud be fit inside the :host container.
         */
        this.previewFitMode = 'cover';
        this._ready = false;
        // instance based emitters
        this.autostarted = new EventEmitter();
        this.autostarting = new EventEmitter();
        this.torchCompatible = new EventEmitter(false);
        this.scanSuccess = new EventEmitter();
        this.scanFailure = new EventEmitter();
        this.scanError = new EventEmitter();
        this.scanComplete = new EventEmitter();
        this.camerasFound = new EventEmitter();
        this.camerasNotFound = new EventEmitter();
        this.permissionResponse = new EventEmitter(true);
        this.hasDevices = new EventEmitter();
        this.deviceChange = new EventEmitter();
        this._enabled = true;
        this._hints = new Map();
        this.autofocusEnabled = true;
        this.autostart = true;
        this.formats = [BarcodeFormat.QR_CODE];
        // computed data
        this.hasNavigator = typeof navigator !== 'undefined';
        this.isMediaDevicesSupported = this.hasNavigator && !!navigator.mediaDevices;
    }
    /**
     * Exposes the current code reader, so the user can use it's APIs.
     */
    get codeReader() {
        return this._codeReader;
    }
    /**
     * User device input
     */
    set device(device) {
        if (!this._ready) {
            this._devicePreStart = device;
            // let's ignore silently, users don't liek logs
            return;
        }
        if (this.isAutostarting) {
            // do not allow setting devices during auto-start, since it will set one and emit it.
            console.warn('Avoid setting a device during auto-start.');
            return;
        }
        if (this.isCurrentDevice(device)) {
            console.warn('Setting the same device is not allowed.');
            return;
        }
        if (!this.hasPermission) {
            console.warn('Permissions not set yet, waiting for them to be set to apply device change.');
            // this.permissionResponse
            //   .pipe(
            //     take(1),
            //     tap(() => console.log(`Permissions set, applying device change${device ? ` (${device.deviceId})` : ''}.`))
            //   )
            //   .subscribe(() => this.device = device);
            return;
        }
        this.setDevice(device);
    }
    /**
     * User device acessor.
     */
    get device() {
        return this._device;
    }
    /**
     * Returns all the registered formats.
     */
    get formats() {
        return this.hints.get(DecodeHintType.POSSIBLE_FORMATS);
    }
    /**
     * Registers formats the scanner should support.
     *
     * @param input BarcodeFormat or case-insensitive string array.
     */
    set formats(input) {
        if (typeof input === 'string') {
            throw new Error('Invalid formats, make sure the [formats] input is a binding.');
        }
        // formats may be set from html template as BarcodeFormat or string array
        const formats = input.map(f => this.getBarcodeFormatOrFail(f));
        const hints = this.hints;
        // updates the hints
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        // handles updating the codeReader
        this.hints = hints;
    }
    /**
     * Returns all the registered hints.
     */
    get hints() {
        return this._hints;
    }
    /**
     * Does what it takes to set the hints.
     */
    set hints(hints) {
        var _a;
        this._hints = hints;
        // new instance with new hints.
        (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.setHints(this._hints);
    }
    /**
     * Sets the desired constraints in all video tracks.
     * @experimental
     */
    set videoConstraints(constraints) {
        var _a;
        // new instance with new hints.
        const controls = (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls();
        if (!controls) {
            // fails silently
            return;
        }
        controls === null || controls === void 0 ? void 0 : controls.streamVideoConstraintsApply(constraints);
    }
    /**
     *
     */
    set isAutostarting(state) {
        this._isAutostarting = state;
        this.autostarting.next(state);
    }
    /**
     *
     */
    get isAutostarting() {
        return this._isAutostarting;
    }
    /**
     * Can turn on/off the device flashlight.
     *
     * @experimental Torch/Flash APIs are not stable in all browsers, it may be buggy!
     */
    set torch(onOff) {
        try {
            const controls = this.getCodeReader().getScannerControls();
            controls.switchTorch(onOff);
        }
        catch (error) {
            // ignore error
        }
    }
    /**
     * Starts and Stops the scanning.
     */
    set enable(enabled) {
        this._enabled = Boolean(enabled);
        if (!this._enabled) {
            this.reset();
        }
        else {
            if (this.device) {
                this.scanFromDevice(this.device.deviceId);
            }
            else {
                this.init();
            }
        }
    }
    /**
     * Tells if the scanner is enabled or not.
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * If is `tryHarder` enabled.
     */
    get tryHarder() {
        return this.hints.get(DecodeHintType.TRY_HARDER);
    }
    /**
     * Enable/disable tryHarder hint.
     */
    set tryHarder(enable) {
        const hints = this.hints;
        if (enable) {
            hints.set(DecodeHintType.TRY_HARDER, true);
        }
        else {
            hints.delete(DecodeHintType.TRY_HARDER);
        }
        this.hints = hints;
    }
    /**
     * Gets and registers all cammeras.
     */
    askForPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasNavigator) {
                console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                this.setPermission(null);
                return this.hasPermission;
            }
            if (!this.isMediaDevicesSupported) {
                console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                this.setPermission(null);
                return this.hasPermission;
            }
            let stream;
            let permission;
            try {
                // Will try to ask for permission
                stream = yield this.getAnyVideoDevice();
                permission = !!stream;
            }
            catch (err) {
                return this.handlePermissionException(err);
            }
            finally {
                this.terminateStream(stream);
            }
            this.setPermission(permission);
            // Returns the permission
            return permission;
        });
    }
    /**
     *
     */
    getAnyVideoDevice() {
        return navigator.mediaDevices.getUserMedia({ video: true });
    }
    /**
     * Terminates a stream and it's tracks.
     */
    terminateStream(stream) {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        stream = undefined;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.autostart) {
                console.warn('Feature \'autostart\' disabled. Permissions and devices recovery has to be run manually.');
                // does the necessary configuration without autostarting
                this.initAutostartOff();
                this._ready = true;
                return;
            }
            // configurates the component and starts the scanner
            yield this.initAutostartOn();
            this._ready = true;
        });
    }
    /**
     * Initializes the component without starting the scanner.
     */
    initAutostartOff() {
        // do not ask for permission when autostart is off
        this.isAutostarting = false;
        // just update devices information
        this.updateVideoInputDevices();
        if (this._device && this._devicePreStart) {
            this.setDevice(this._devicePreStart);
        }
    }
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     */
    initAutostartOn() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isAutostarting = true;
            let hasPermission;
            try {
                // Asks for permission before enumerating devices so it can get all the device's info
                hasPermission = yield this.askForPermission();
            }
            catch (e) {
                console.error('Exception occurred while asking for permission:', e);
                return;
            }
            // from this point, things gonna need permissions
            if (hasPermission) {
                const devices = yield this.updateVideoInputDevices();
                yield this.autostartScanner([...devices]);
            }
            this.isAutostarting = false;
            this.autostarted.next();
        });
    }
    /**
     * Checks if the given device is the current defined one.
     */
    isCurrentDevice(device) {
        var _a;
        return (device === null || device === void 0 ? void 0 : device.deviceId) === ((_a = this._device) === null || _a === void 0 ? void 0 : _a.deviceId);
    }
    /**
     * Executes some actions before destroy the component.
     */
    ngOnDestroy() {
        return __awaiter(this, void 0, void 0, function* () {
            let stream = yield this.getAnyVideoDevice();
            this.terminateStream(stream);
            return new Promise((resolve) => {
                const videoEl = this.previewElemRef.nativeElement;
                if (videoEl) {
                    const stream = videoEl.srcObject;
                    if (stream) {
                        const tracks = stream.getTracks();
                        tracks.forEach(function (track) {
                            track.stop();
                        });
                        videoEl.srcObject = null;
                    }
                    else {
                        console.log('No stream available', { videoEl });
                    }
                }
                else {
                    console.log('No video stream', { videoEl });
                }
                this.reset();
                resolve(null);
            });
        });
    }
    /**
     *
     */
    ngOnInit() {
        this.init();
    }
    /**
     * Stops the scanning, if any.
     */
    scanStop() {
        var _a, _b;
        if (this._scanSubscription) {
            (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls().stop();
            (_b = this._scanSubscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
            this._scanSubscription = undefined;
        }
        this.torchCompatible.next(false);
    }
    /**
     * Stops the scanning, if any.
     */
    scanStart() {
        if (this._scanSubscription) {
            throw new Error('There is already a scan proccess running.');
        }
        if (!this._device) {
            throw new Error('No device defined, cannot start scan, please define a device.');
        }
        this.scanFromDevice(this._device.deviceId);
    }
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     */
    restart() {
        // @note apenas necessario por enquanto causa da Torch
        this._codeReader = undefined;
        const prevDevice = this._reset();
        if (!prevDevice) {
            return;
        }
        this.device = prevDevice;
    }
    /**
     * Discovers and updates known video input devices.
     */
    updateVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // permissions aren't needed to get devices, but to access them and their info
            const devices = (yield BrowserCodeReader.listVideoInputDevices()) || [];
            const hasDevices = devices && devices.length > 0;
            // stores discovered devices and updates information
            this.hasDevices.next(hasDevices);
            this.camerasFound.next([...devices]);
            if (!hasDevices) {
                this.camerasNotFound.next();
            }
            return devices;
        });
    }
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     */
    autostartScanner(devices) {
        return __awaiter(this, void 0, void 0, function* () {
            const matcher = ({ label }) => /back|trás|rear|traseira|environment|ambiente/gi.test(label);
            // select the rear camera by default, otherwise take the last camera.
            const device = devices.find(matcher) || devices.pop();
            if (!device) {
                throw new Error('Impossible to autostart, no input devices available.');
            }
            yield this.setDevice(device);
            this.deviceChange.next(device);
        });
    }
    /**
     * Dispatches the scan success event.
     *
     * @param result the scan result.
     */
    dispatchScanSuccess(result) {
        this.scanSuccess.next(result.getText());
    }
    /**
     * Dispatches the scan failure event.
     */
    dispatchScanFailure(reason) {
        this.scanFailure.next(reason);
    }
    /**
     * Dispatches the scan error event.
     *
     * @param error the error thing.
     */
    dispatchScanError(error) {
        if (!this.scanError.observers.some(x => Boolean(x))) {
            console.error(`zxing scanner component: ${error.name}`, error);
            console.warn('Use the `(scanError)` property to handle errors like this!');
        }
        this.scanError.next(error);
    }
    /**
     * Dispatches the scan event.
     *
     * @param result the scan result.
     */
    dispatchScanComplete(result) {
        this.scanComplete.next(result);
    }
    /**
     * Returns the filtered permission.
     */
    handlePermissionException(err) {
        // failed to grant permission to video input
        console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
        let permission;
        switch (err.name) {
            // usually caused by not secure origins
            case 'NotSupportedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // could not claim
                permission = null;
                // can't check devices
                this.hasDevices.next(null);
                break;
            // user denied permission
            case 'NotAllowedError':
                console.warn('@zxing/ngx-scanner', err.message);
                // claimed and denied permission
                permission = false;
                // this means that input devices exists
                this.hasDevices.next(true);
                break;
            // the device has no attached input devices
            case 'NotFoundError':
                console.warn('@zxing/ngx-scanner', err.message);
                // no permissions claimed
                permission = null;
                // because there was no devices
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            case 'NotReadableError':
                console.warn('@zxing/ngx-scanner', 'Couldn\'t read the device(s)\'s stream, it\'s probably in use by another app.');
                // no permissions claimed
                permission = null;
                // there are devices, which I couldn't use
                this.hasDevices.next(false);
                // tells the listener about the error
                this.camerasNotFound.next(err);
                break;
            default:
                console.warn('@zxing/ngx-scanner', 'I was not able to define if I have permissions for camera or not.', err);
                // unknown
                permission = null;
                // this.hasDevices.next(undefined;
                break;
        }
        this.setPermission(permission);
        // tells the listener about the error
        this.permissionResponse.error(err);
        return permission;
    }
    /**
     * Returns a valid BarcodeFormat or fails.
     */
    getBarcodeFormatOrFail(format) {
        return typeof format === 'string'
            ? BarcodeFormat[format.trim().toUpperCase()]
            : format;
    }
    /**
     * Retorna um code reader, cria um se nenhume existe.
     */
    getCodeReader() {
        if (!this._codeReader) {
            const options = {
                delayBetweenScanAttempts: this.timeBetweenScans,
                delayBetweenScanSuccess: this.delayBetweenScanSuccess,
            };
            this._codeReader = new BrowserMultiFormatContinuousReader(this.hints, options);
        }
        return this._codeReader;
    }
    /**
     * Starts the continuous scanning for the given device.
     *
     * @param deviceId The deviceId from the device.
     */
    scanFromDevice(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoElement = this.previewElemRef.nativeElement;
            const codeReader = this.getCodeReader();
            const scanStream = yield codeReader.scanFromDeviceObservable(deviceId, videoElement);
            if (!scanStream) {
                throw new Error('Undefined decoding stream, aborting.');
            }
            const next = (x) => this._onDecodeResult(x.result, x.error);
            const error = (err) => this._onDecodeError(err);
            const complete = () => { };
            this._scanSubscription = scanStream.subscribe(next, error, complete);
            if (this._scanSubscription.closed) {
                return;
            }
            const controls = codeReader.getScannerControls();
            const hasTorchControl = typeof controls.switchTorch !== 'undefined';
            this.torchCompatible.next(hasTorchControl);
        });
    }
    /**
     * Handles decode errors.
     */
    _onDecodeError(err) {
        this.dispatchScanError(err);
        // this.reset();
    }
    /**
     * Handles decode results.
     */
    _onDecodeResult(result, error) {
        if (result) {
            this.dispatchScanSuccess(result);
        }
        else {
            this.dispatchScanFailure(error);
        }
        this.dispatchScanComplete(result);
    }
    /**
     * Stops the code reader and returns the previous selected device.
     */
    _reset() {
        if (!this._codeReader) {
            return;
        }
        const device = this._device;
        // do not set this.device inside this method, it would create a recursive loop
        this.device = undefined;
        this._codeReader = undefined;
        return device;
    }
    /**
     * Resets the scanner and emits device change.
     */
    reset() {
        this._reset();
        this.deviceChange.emit(null);
    }
    /**
     * Sets the current device.
     */
    setDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            // instantly stops the scan before changing devices
            this.scanStop();
            // correctly sets the new (or none) device
            this._device = device || undefined;
            if (!this._device) {
                // cleans the video because user removed the device
                BrowserCodeReader.cleanVideoSource(this.previewElemRef.nativeElement);
            }
            // if enabled, starts scanning
            if (this._enabled && device) {
                yield this.scanFromDevice(device.deviceId);
            }
        });
    }
    /**
     * Sets the permission value and emmits the event.
     */
    setPermission(hasPermission) {
        this.hasPermission = hasPermission;
        this.permissionResponse.next(hasPermission);
    }
}
ZXingScannerComponent.decorators = [
    { type: Component, args: [{
                selector: 'zxing-scanner',
                template: "<video #preview [style.object-fit]=\"previewFitMode\">\n  <p>\n    Your browser does not support this feature, please try to upgrade it.\n  </p>\n  <p>\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\n  </p>\n</video>\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
            },] }
];
ZXingScannerComponent.ctorParameters = () => [];
ZXingScannerComponent.propDecorators = {
    previewElemRef: [{ type: ViewChild, args: ['preview', { static: true },] }],
    autofocusEnabled: [{ type: Input }],
    timeBetweenScans: [{ type: Input }],
    delayBetweenScanSuccess: [{ type: Input }],
    autostarted: [{ type: Output }],
    autostarting: [{ type: Output }],
    autostart: [{ type: Input }],
    previewFitMode: [{ type: Input }],
    torchCompatible: [{ type: Output }],
    scanSuccess: [{ type: Output }],
    scanFailure: [{ type: Output }],
    scanError: [{ type: Output }],
    scanComplete: [{ type: Output }],
    camerasFound: [{ type: Output }],
    camerasNotFound: [{ type: Output }],
    permissionResponse: [{ type: Output }],
    hasDevices: [{ type: Output }],
    device: [{ type: Input }],
    deviceChange: [{ type: Output }],
    formats: [{ type: Input }],
    videoConstraints: [{ type: Input }],
    torch: [{ type: Input }],
    enable: [{ type: Input }],
    tryHarder: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoienhpbmctc2Nhbm5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy96eGluZy1zY2FubmVyL3NyYy9saWIvenhpbmctc2Nhbm5lci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUdMLE1BQU0sRUFDTixTQUFTLEVBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUNMLGFBQWEsRUFDYixjQUFjLEVBR2YsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsa0NBQWtDLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQztBQVU5RixNQUFNLE9BQU8scUJBQXFCO0lBa1doQzs7T0FFRztJQUNIO1FBMVNBOztXQUVHO1FBRUgscUJBQWdCLEdBQUcsR0FBRyxDQUFDO1FBRXZCOztXQUVHO1FBRUgsNEJBQXVCLEdBQUcsR0FBRyxDQUFDO1FBb0I5Qjs7V0FFRztRQUVILG1CQUFjLEdBQXlELE9BQU8sQ0FBQztRQXdEdkUsV0FBTSxHQUFHLEtBQUssQ0FBQztRQWlOckIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxZQUFZLEVBQUUs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dUIsQ0FBQyxNQUFNOzthQUNoRDs7Ozs2QkFtREUsU0FBUyxTQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7K0JBTXJDLEtBQUs7K0JBTUwsS0FBSztzQ0FNTCxLQUFLOzBCQU1MLE1BQU07MkJBTU4sTUFBTTt3QkFNTixLQUFLOzZCQU1MLEtBQUs7OEJBTUwsTUFBTTswQkFNTixNQUFNOzBCQU1OLE1BQU07d0JBTU4sTUFBTTsyQkFNTixNQUFNOzJCQU1OLE1BQU07OEJBTU4sTUFBTTtpQ0FNTixNQUFNO3lCQU1OLE1BQU07cUJBaUJOLEtBQUs7MkJBcUNMLE1BQU07c0JBc0JOLEtBQUs7K0JBdUNMLEtBQUs7b0JBaUNMLEtBQUs7cUJBYUwsS0FBSzt3QkFpQ0wsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFZpZXdDaGlsZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEJyb3dzZXJDb2RlUmVhZGVyIH0gZnJvbSAnQHp4aW5nL2Jyb3dzZXInO1xuaW1wb3J0IHtcbiAgQmFyY29kZUZvcm1hdCxcbiAgRGVjb2RlSGludFR5cGUsXG4gIEV4Y2VwdGlvbixcbiAgUmVzdWx0XG59IGZyb20gJ0B6eGluZy9saWJyYXJ5JztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlciB9IGZyb20gJy4vYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXInO1xuaW1wb3J0IHsgUmVzdWx0QW5kRXJyb3IgfSBmcm9tICcuL1Jlc3VsdEFuZEVycm9yJztcblxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICd6eGluZy1zY2FubmVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL3p4aW5nLXNjYW5uZXIuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi96eGluZy1zY2FubmVyLmNvbXBvbmVudC5zY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIFpYaW5nU2Nhbm5lckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcblxuICAvKipcbiAgICogU3VwcG9ydGVkIEhpbnRzIG1hcC5cbiAgICovXG4gIHByaXZhdGUgX2hpbnRzOiBNYXA8RGVjb2RlSGludFR5cGUsIGFueT4gfCBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgWlhpbmcgY29kZSByZWFkZXIuXG4gICAqL1xuICBwcml2YXRlIF9jb2RlUmVhZGVyOiBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyO1xuXG4gIC8qKlxuICAgKiBUaGUgZGV2aWNlIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gc2NhbiB0aGluZ3MuXG4gICAqL1xuICBwcml2YXRlIF9kZXZpY2U6IE1lZGlhRGV2aWNlSW5mbztcblxuICAvKipcbiAgICogVGhlIGRldmljZSB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHNjYW4gdGhpbmdzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICpcbiAgICovXG4gIHByaXZhdGUgX2lzQXV0b3N0YXJ0aW5nOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBIYXMgYG5hdmlnYXRvcmAgYWNjZXNzLlxuICAgKi9cbiAgcHJpdmF0ZSBoYXNOYXZpZ2F0b3I6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFNheXMgaWYgc29tZSBuYXRpdmUgQVBJIGlzIHN1cHBvcnRlZC5cbiAgICovXG4gIHByaXZhdGUgaXNNZWRpYURldmljZXNTdXBwb3J0ZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIElmIHRoZSB1c2VyLWFnZW50IGFsbG93ZWQgdGhlIHVzZSBvZiB0aGUgY2FtZXJhIG9yIG5vdC5cbiAgICovXG4gIHByaXZhdGUgaGFzUGVybWlzc2lvbjogYm9vbGVhbiB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFVuc3Vic2NyaWJlIHRvIHN0b3Agc2Nhbm5pbmcuXG4gICAqL1xuICBwcml2YXRlIF9zY2FuU3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIHByZXZpZXcgZWxlbWVudCwgc2hvdWxkIGJlIHRoZSBgdmlkZW9gIHRhZy5cbiAgICovXG4gIEBWaWV3Q2hpbGQoJ3ByZXZpZXcnLCB7IHN0YXRpYzogdHJ1ZSB9KVxuICBwcmV2aWV3RWxlbVJlZjogRWxlbWVudFJlZjxIVE1MVmlkZW9FbGVtZW50PjtcblxuICAvKipcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgYXV0b2ZvY3VzIG9mIHRoZSBjYW1lcmEgKG1pZ2h0IGhhdmUgYW4gaW1wYWN0IG9uIHBlcmZvcm1hbmNlKVxuICAgKi9cbiAgQElucHV0KClcbiAgYXV0b2ZvY3VzRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogRGVsYXkgYmV0d2VlbiBhdHRlbXB0cyB0byBkZWNvZGUgKGRlZmF1bHQgaXMgNTAwbXMpXG4gICAqL1xuICBASW5wdXQoKVxuICB0aW1lQmV0d2VlblNjYW5zID0gNTAwO1xuXG4gIC8qKlxuICAgKiBEZWxheSBiZXR3ZWVuIHN1Y2Nlc3NmdWwgZGVjb2RlIChkZWZhdWx0IGlzIDUwMG1zKVxuICAgKi9cbiAgQElucHV0KClcbiAgZGVsYXlCZXR3ZWVuU2NhblN1Y2Nlc3MgPSA1MDA7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gYW5kIGlmIHRoZSBzY2FubmVyIGlzIGF1dG9zdGFydGVkLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIGF1dG9zdGFydGVkOiBFdmVudEVtaXR0ZXI8dm9pZD47XG5cbiAgLyoqXG4gICAqIFRydWUgZHVyaW5nIGF1dG9zdGFydCBhbmQgZmFsc2UgYWZ0ZXIuIEl0IHdpbGwgYmUgbnVsbCBpZiB3b24ndCBhdXRvc3RhcnQgYXQgYWxsLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIGF1dG9zdGFydGluZzogRXZlbnRFbWl0dGVyPGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBJZiB0aGUgc2Nhbm5lciBzaG91bGQgYXV0b3N0YXJ0IHdpdGggdGhlIGZpcnN0IGF2YWlsYWJsZSBkZXZpY2UuXG4gICAqL1xuICBASW5wdXQoKVxuICBhdXRvc3RhcnQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEhvdyB0aGUgcHJldmlldyBlbGVtZW50IHNob3VkIGJlIGZpdCBpbnNpZGUgdGhlIDpob3N0IGNvbnRhaW5lci5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHByZXZpZXdGaXRNb2RlOiAnZmlsbCcgfCAnY29udGFpbicgfCAnY292ZXInIHwgJ3NjYWxlLWRvd24nIHwgJ25vbmUnID0gJ2NvdmVyJztcblxuICAvKipcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIHRoZSB0b3JjaCBjb21wYXRpYmlsaXR5IGlzIGNoYW5nZWQuXG4gICAqL1xuICBAT3V0cHV0KClcbiAgdG9yY2hDb21wYXRpYmxlOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gaXMgc3VjY2Vzc2Z1bCBwZXJmb3JtZWQsIHdpbGwgaW5qZWN0IHRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIFFSLWNvZGUgdG8gdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHNjYW5TdWNjZXNzOiBFdmVudEVtaXR0ZXI8c3RyaW5nPjtcblxuICAvKipcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGEgc2NhbiBmYWlscyB3aXRob3V0IGVycm9ycywgdXNlZnVsbCB0byBrbm93IGhvdyBtdWNoIHNjYW4gdHJpZXMgd2hlcmUgbWFkZS5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBzY2FuRmFpbHVyZTogRXZlbnRFbWl0dGVyPEV4Y2VwdGlvbiB8IHVuZGVmaW5lZD47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gdGhyb3dzIHNvbWUgZXJyb3IsIHdpbGwgaW5qZWN0IHRoZSBlcnJvciB0byB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBAT3V0cHV0KClcbiAgc2NhbkVycm9yOiBFdmVudEVtaXR0ZXI8RXJyb3I+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gYSBzY2FuIGlzIHBlcmZvcm1lZCwgd2lsbCBpbmplY3QgdGhlIFJlc3VsdCB2YWx1ZSBvZiB0aGUgUVItY29kZSBzY2FuIChpZiBhdmFpbGFibGUpIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBzY2FuQ29tcGxldGU6IEV2ZW50RW1pdHRlcjxSZXN1bHQ+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gbm8gY2FtZXJhcyBhcmUgZm91bmQsIHdpbGwgaW5qZWN0IGFuIGV4Y2VwdGlvbiAoaWYgYXZhaWxhYmxlKSB0byB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBAT3V0cHV0KClcbiAgY2FtZXJhc0ZvdW5kOiBFdmVudEVtaXR0ZXI8TWVkaWFEZXZpY2VJbmZvW10+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gbm8gY2FtZXJhcyBhcmUgZm91bmQsIHdpbGwgaW5qZWN0IGFuIGV4Y2VwdGlvbiAoaWYgYXZhaWxhYmxlKSB0byB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBAT3V0cHV0KClcbiAgY2FtZXJhc05vdEZvdW5kOiBFdmVudEVtaXR0ZXI8YW55PjtcblxuICAvKipcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIHRoZSB1c2VycyBhbnN3ZXJzIGZvciBwZXJtaXNzaW9uLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHBlcm1pc3Npb25SZXNwb25zZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gaGFzIGRldmljZXMgc3RhdHVzIGlzIHVwZGF0ZS5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBoYXNEZXZpY2VzOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XG5cbiAgcHJpdmF0ZSBfcmVhZHkgPSBmYWxzZTtcblxuICBwcml2YXRlIF9kZXZpY2VQcmVTdGFydDogTWVkaWFEZXZpY2VJbmZvO1xuXG4gIC8qKlxuICAgKiBFeHBvc2VzIHRoZSBjdXJyZW50IGNvZGUgcmVhZGVyLCBzbyB0aGUgdXNlciBjYW4gdXNlIGl0J3MgQVBJcy5cbiAgICovXG4gIGdldCBjb2RlUmVhZGVyKCk6IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXIge1xuICAgIHJldHVybiB0aGlzLl9jb2RlUmVhZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXIgZGV2aWNlIGlucHV0XG4gICAqL1xuICBASW5wdXQoKVxuICBzZXQgZGV2aWNlKGRldmljZTogTWVkaWFEZXZpY2VJbmZvIHwgdW5kZWZpbmVkKSB7XG5cbiAgICBpZiAoIXRoaXMuX3JlYWR5KSB7XG4gICAgICB0aGlzLl9kZXZpY2VQcmVTdGFydCA9IGRldmljZTtcbiAgICAgIC8vIGxldCdzIGlnbm9yZSBzaWxlbnRseSwgdXNlcnMgZG9uJ3QgbGllayBsb2dzXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNBdXRvc3RhcnRpbmcpIHtcbiAgICAgIC8vIGRvIG5vdCBhbGxvdyBzZXR0aW5nIGRldmljZXMgZHVyaW5nIGF1dG8tc3RhcnQsIHNpbmNlIGl0IHdpbGwgc2V0IG9uZSBhbmQgZW1pdCBpdC5cbiAgICAgIGNvbnNvbGUud2FybignQXZvaWQgc2V0dGluZyBhIGRldmljZSBkdXJpbmcgYXV0by1zdGFydC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0N1cnJlbnREZXZpY2UoZGV2aWNlKSkge1xuICAgICAgY29uc29sZS53YXJuKCdTZXR0aW5nIHRoZSBzYW1lIGRldmljZSBpcyBub3QgYWxsb3dlZC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGFzUGVybWlzc2lvbikge1xuICAgICAgY29uc29sZS53YXJuKCdQZXJtaXNzaW9ucyBub3Qgc2V0IHlldCwgd2FpdGluZyBmb3IgdGhlbSB0byBiZSBzZXQgdG8gYXBwbHkgZGV2aWNlIGNoYW5nZS4nKTtcbiAgICAgIC8vIHRoaXMucGVybWlzc2lvblJlc3BvbnNlXG4gICAgICAvLyAgIC5waXBlKFxuICAgICAgLy8gICAgIHRha2UoMSksXG4gICAgICAvLyAgICAgdGFwKCgpID0+IGNvbnNvbGUubG9nKGBQZXJtaXNzaW9ucyBzZXQsIGFwcGx5aW5nIGRldmljZSBjaGFuZ2Uke2RldmljZSA/IGAgKCR7ZGV2aWNlLmRldmljZUlkfSlgIDogJyd9LmApKVxuICAgICAgLy8gICApXG4gICAgICAvLyAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5kZXZpY2UgPSBkZXZpY2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RGV2aWNlKGRldmljZSk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgd2hlbiB0aGUgY3VycmVudCBkZXZpY2UgaXMgY2hhbmdlZC5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBkZXZpY2VDaGFuZ2U6IEV2ZW50RW1pdHRlcjxNZWRpYURldmljZUluZm8+O1xuXG4gIC8qKlxuICAgKiBVc2VyIGRldmljZSBhY2Vzc29yLlxuICAgKi9cbiAgZ2V0IGRldmljZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGV2aWNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYWxsIHRoZSByZWdpc3RlcmVkIGZvcm1hdHMuXG4gICAqL1xuICBnZXQgZm9ybWF0cygpOiBCYXJjb2RlRm9ybWF0W10ge1xuICAgIHJldHVybiB0aGlzLmhpbnRzLmdldChEZWNvZGVIaW50VHlwZS5QT1NTSUJMRV9GT1JNQVRTKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgZm9ybWF0cyB0aGUgc2Nhbm5lciBzaG91bGQgc3VwcG9ydC5cbiAgICpcbiAgICogQHBhcmFtIGlucHV0IEJhcmNvZGVGb3JtYXQgb3IgY2FzZS1pbnNlbnNpdGl2ZSBzdHJpbmcgYXJyYXkuXG4gICAqL1xuICBASW5wdXQoKVxuICBzZXQgZm9ybWF0cyhpbnB1dDogQmFyY29kZUZvcm1hdFtdKSB7XG5cbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZvcm1hdHMsIG1ha2Ugc3VyZSB0aGUgW2Zvcm1hdHNdIGlucHV0IGlzIGEgYmluZGluZy4nKTtcbiAgICB9XG5cbiAgICAvLyBmb3JtYXRzIG1heSBiZSBzZXQgZnJvbSBodG1sIHRlbXBsYXRlIGFzIEJhcmNvZGVGb3JtYXQgb3Igc3RyaW5nIGFycmF5XG4gICAgY29uc3QgZm9ybWF0cyA9IGlucHV0Lm1hcChmID0+IHRoaXMuZ2V0QmFyY29kZUZvcm1hdE9yRmFpbChmKSk7XG5cbiAgICBjb25zdCBoaW50cyA9IHRoaXMuaGludHM7XG5cbiAgICAvLyB1cGRhdGVzIHRoZSBoaW50c1xuICAgIGhpbnRzLnNldChEZWNvZGVIaW50VHlwZS5QT1NTSUJMRV9GT1JNQVRTLCBmb3JtYXRzKTtcblxuICAgIC8vIGhhbmRsZXMgdXBkYXRpbmcgdGhlIGNvZGVSZWFkZXJcbiAgICB0aGlzLmhpbnRzID0gaGludHM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgdGhlIHJlZ2lzdGVyZWQgaGludHMuXG4gICAqL1xuICBnZXQgaGludHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hpbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIERvZXMgd2hhdCBpdCB0YWtlcyB0byBzZXQgdGhlIGhpbnRzLlxuICAgKi9cbiAgc2V0IGhpbnRzKGhpbnRzOiBNYXA8RGVjb2RlSGludFR5cGUsIGFueT4pIHtcbiAgICB0aGlzLl9oaW50cyA9IGhpbnRzO1xuICAgIC8vIG5ldyBpbnN0YW5jZSB3aXRoIG5ldyBoaW50cy5cbiAgICB0aGlzLmNvZGVSZWFkZXI/LnNldEhpbnRzKHRoaXMuX2hpbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZXNpcmVkIGNvbnN0cmFpbnRzIGluIGFsbCB2aWRlbyB0cmFja3MuXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCB2aWRlb0NvbnN0cmFpbnRzKGNvbnN0cmFpbnRzOiBNZWRpYVRyYWNrQ29uc3RyYWludHMpIHtcbiAgICAvLyBuZXcgaW5zdGFuY2Ugd2l0aCBuZXcgaGludHMuXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmNvZGVSZWFkZXI/LmdldFNjYW5uZXJDb250cm9scygpO1xuXG4gICAgaWYgKCFjb250cm9scykge1xuICAgICAgLy8gZmFpbHMgc2lsZW50bHlcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb250cm9scz8uc3RyZWFtVmlkZW9Db25zdHJhaW50c0FwcGx5KGNvbnN0cmFpbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgc2V0IGlzQXV0b3N0YXJ0aW5nKHN0YXRlOiBib29sZWFuKSB7XG4gICAgdGhpcy5faXNBdXRvc3RhcnRpbmcgPSBzdGF0ZTtcbiAgICB0aGlzLmF1dG9zdGFydGluZy5uZXh0KHN0YXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgZ2V0IGlzQXV0b3N0YXJ0aW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc0F1dG9zdGFydGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDYW4gdHVybiBvbi9vZmYgdGhlIGRldmljZSBmbGFzaGxpZ2h0LlxuICAgKlxuICAgKiBAZXhwZXJpbWVudGFsIFRvcmNoL0ZsYXNoIEFQSXMgYXJlIG5vdCBzdGFibGUgaW4gYWxsIGJyb3dzZXJzLCBpdCBtYXkgYmUgYnVnZ3khXG4gICAqL1xuICBASW5wdXQoKVxuICBzZXQgdG9yY2gob25PZmY6IGJvb2xlYW4pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldENvZGVSZWFkZXIoKS5nZXRTY2FubmVyQ29udHJvbHMoKTtcbiAgICAgIGNvbnRyb2xzLnN3aXRjaFRvcmNoKG9uT2ZmKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gaWdub3JlIGVycm9yXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyBhbmQgU3RvcHMgdGhlIHNjYW5uaW5nLlxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IGVuYWJsZShlbmFibGVkOiBib29sZWFuKSB7XG5cbiAgICB0aGlzLl9lbmFibGVkID0gQm9vbGVhbihlbmFibGVkKTtcblxuICAgIGlmICghdGhpcy5fZW5hYmxlZCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5kZXZpY2UpIHtcbiAgICAgICAgdGhpcy5zY2FuRnJvbURldmljZSh0aGlzLmRldmljZS5kZXZpY2VJZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGVsbHMgaWYgdGhlIHNjYW5uZXIgaXMgZW5hYmxlZCBvciBub3QuXG4gICAqL1xuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBpcyBgdHJ5SGFyZGVyYCBlbmFibGVkLlxuICAgKi9cbiAgZ2V0IHRyeUhhcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oaW50cy5nZXQoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUik7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlL2Rpc2FibGUgdHJ5SGFyZGVyIGhpbnQuXG4gICAqL1xuICBASW5wdXQoKVxuICBzZXQgdHJ5SGFyZGVyKGVuYWJsZTogYm9vbGVhbikge1xuXG4gICAgY29uc3QgaGludHMgPSB0aGlzLmhpbnRzO1xuXG4gICAgaWYgKGVuYWJsZSkge1xuICAgICAgaGludHMuc2V0KERlY29kZUhpbnRUeXBlLlRSWV9IQVJERVIsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaW50cy5kZWxldGUoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUik7XG4gICAgfVxuXG4gICAgdGhpcy5oaW50cyA9IGhpbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIHRvIGJ1aWxkIHRoZSBvYmplY3QgYW5kIGRvIHNvbWUgREkuXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBpbnN0YW5jZSBiYXNlZCBlbWl0dGVyc1xuICAgIHRoaXMuYXV0b3N0YXJ0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5hdXRvc3RhcnRpbmcgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy50b3JjaENvbXBhdGlibGUgPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcbiAgICB0aGlzLnNjYW5TdWNjZXNzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuc2NhbkZhaWx1cmUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5zY2FuRXJyb3IgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5zY2FuQ29tcGxldGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5jYW1lcmFzRm91bmQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5jYW1lcmFzTm90Rm91bmQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UgPSBuZXcgRXZlbnRFbWl0dGVyKHRydWUpO1xuICAgIHRoaXMuaGFzRGV2aWNlcyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLmRldmljZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuX2hpbnRzID0gbmV3IE1hcDxEZWNvZGVIaW50VHlwZSwgYW55PigpO1xuICAgIHRoaXMuYXV0b2ZvY3VzRW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5hdXRvc3RhcnQgPSB0cnVlO1xuICAgIHRoaXMuZm9ybWF0cyA9IFtCYXJjb2RlRm9ybWF0LlFSX0NPREVdO1xuXG4gICAgLy8gY29tcHV0ZWQgZGF0YVxuICAgIHRoaXMuaGFzTmF2aWdhdG9yID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgdGhpcy5pc01lZGlhRGV2aWNlc1N1cHBvcnRlZCA9IHRoaXMuaGFzTmF2aWdhdG9yICYmICEhbmF2aWdhdG9yLm1lZGlhRGV2aWNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuZCByZWdpc3RlcnMgYWxsIGNhbW1lcmFzLlxuICAgKi9cbiAgYXN5bmMgYXNrRm9yUGVybWlzc2lvbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICAgIGlmICghdGhpcy5oYXNOYXZpZ2F0b3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDYW5cXCd0IGFzayBwZXJtaXNzaW9uLCBuYXZpZ2F0b3IgaXMgbm90IHByZXNlbnQuJyk7XG4gICAgICB0aGlzLnNldFBlcm1pc3Npb24obnVsbCk7XG4gICAgICByZXR1cm4gdGhpcy5oYXNQZXJtaXNzaW9uO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5pc01lZGlhRGV2aWNlc1N1cHBvcnRlZCkge1xuICAgICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0NhblxcJ3QgZ2V0IHVzZXIgbWVkaWEsIHRoaXMgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIHRoaXMuc2V0UGVybWlzc2lvbihudWxsKTtcbiAgICAgIHJldHVybiB0aGlzLmhhc1Blcm1pc3Npb247XG4gICAgfVxuXG4gICAgbGV0IHN0cmVhbTogTWVkaWFTdHJlYW07XG4gICAgbGV0IHBlcm1pc3Npb246IGJvb2xlYW47XG5cbiAgICB0cnkge1xuICAgICAgLy8gV2lsbCB0cnkgdG8gYXNrIGZvciBwZXJtaXNzaW9uXG4gICAgICBzdHJlYW0gPSBhd2FpdCB0aGlzLmdldEFueVZpZGVvRGV2aWNlKCk7XG4gICAgICBwZXJtaXNzaW9uID0gISFzdHJlYW07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVQZXJtaXNzaW9uRXhjZXB0aW9uKGVycik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMudGVybWluYXRlU3RyZWFtKHN0cmVhbSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRQZXJtaXNzaW9uKHBlcm1pc3Npb24pO1xuXG4gICAgLy8gUmV0dXJucyB0aGUgcGVybWlzc2lvblxuICAgIHJldHVybiBwZXJtaXNzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICBnZXRBbnlWaWRlb0RldmljZSgpOiBQcm9taXNlPE1lZGlhU3RyZWFtPiB7XG4gICAgcmV0dXJuIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgdmlkZW86IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogVGVybWluYXRlcyBhIHN0cmVhbSBhbmQgaXQncyB0cmFja3MuXG4gICAqL1xuICBwcml2YXRlIHRlcm1pbmF0ZVN0cmVhbShzdHJlYW06IE1lZGlhU3RyZWFtKSB7XG5cbiAgICBpZiAoc3RyZWFtKSB7XG4gICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHQuc3RvcCgpKTtcbiAgICB9XG5cbiAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXQoKSB7XG4gICAgaWYgKCF0aGlzLmF1dG9zdGFydCkge1xuICAgICAgY29uc29sZS53YXJuKCdGZWF0dXJlIFxcJ2F1dG9zdGFydFxcJyBkaXNhYmxlZC4gUGVybWlzc2lvbnMgYW5kIGRldmljZXMgcmVjb3ZlcnkgaGFzIHRvIGJlIHJ1biBtYW51YWxseS4nKTtcblxuICAgICAgLy8gZG9lcyB0aGUgbmVjZXNzYXJ5IGNvbmZpZ3VyYXRpb24gd2l0aG91dCBhdXRvc3RhcnRpbmdcbiAgICAgIHRoaXMuaW5pdEF1dG9zdGFydE9mZigpO1xuXG4gICAgICB0aGlzLl9yZWFkeSA9IHRydWU7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBjb25maWd1cmF0ZXMgdGhlIGNvbXBvbmVudCBhbmQgc3RhcnRzIHRoZSBzY2FubmVyXG4gICAgYXdhaXQgdGhpcy5pbml0QXV0b3N0YXJ0T24oKTtcblxuICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgY29tcG9uZW50IHdpdGhvdXQgc3RhcnRpbmcgdGhlIHNjYW5uZXIuXG4gICAqL1xuICBwcml2YXRlIGluaXRBdXRvc3RhcnRPZmYoKTogdm9pZCB7XG5cbiAgICAvLyBkbyBub3QgYXNrIGZvciBwZXJtaXNzaW9uIHdoZW4gYXV0b3N0YXJ0IGlzIG9mZlxuICAgIHRoaXMuaXNBdXRvc3RhcnRpbmcgPSBmYWxzZTtcblxuICAgIC8vIGp1c3QgdXBkYXRlIGRldmljZXMgaW5mb3JtYXRpb25cbiAgICB0aGlzLnVwZGF0ZVZpZGVvSW5wdXREZXZpY2VzKCk7XG5cbiAgICBpZiAodGhpcy5fZGV2aWNlICYmIHRoaXMuX2RldmljZVByZVN0YXJ0KSB7XG4gICAgICB0aGlzLnNldERldmljZSh0aGlzLl9kZXZpY2VQcmVTdGFydCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBjb21wb25lbnQgYW5kIHN0YXJ0cyB0aGUgc2Nhbm5lci5cbiAgICogUGVybWlzc2lvbnMgYXJlIGFza2VkIHRvIGFjY29tcGxpc2ggdGhhdC5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgaW5pdEF1dG9zdGFydE9uKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgdGhpcy5pc0F1dG9zdGFydGluZyA9IHRydWU7XG5cbiAgICBsZXQgaGFzUGVybWlzc2lvbjogYm9vbGVhbjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBBc2tzIGZvciBwZXJtaXNzaW9uIGJlZm9yZSBlbnVtZXJhdGluZyBkZXZpY2VzIHNvIGl0IGNhbiBnZXQgYWxsIHRoZSBkZXZpY2UncyBpbmZvXG4gICAgICBoYXNQZXJtaXNzaW9uID0gYXdhaXQgdGhpcy5hc2tGb3JQZXJtaXNzaW9uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignRXhjZXB0aW9uIG9jY3VycmVkIHdoaWxlIGFza2luZyBmb3IgcGVybWlzc2lvbjonLCBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmcm9tIHRoaXMgcG9pbnQsIHRoaW5ncyBnb25uYSBuZWVkIHBlcm1pc3Npb25zXG4gICAgaWYgKGhhc1Blcm1pc3Npb24pIHtcbiAgICAgIGNvbnN0IGRldmljZXMgPSBhd2FpdCB0aGlzLnVwZGF0ZVZpZGVvSW5wdXREZXZpY2VzKCk7XG4gICAgICBhd2FpdCB0aGlzLmF1dG9zdGFydFNjYW5uZXIoWy4uLmRldmljZXNdKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzQXV0b3N0YXJ0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5hdXRvc3RhcnRlZC5uZXh0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBkZXZpY2UgaXMgdGhlIGN1cnJlbnQgZGVmaW5lZCBvbmUuXG4gICAqL1xuICBpc0N1cnJlbnREZXZpY2UoZGV2aWNlPzogTWVkaWFEZXZpY2VJbmZvKSB7XG4gICAgcmV0dXJuIGRldmljZT8uZGV2aWNlSWQgPT09IHRoaXMuX2RldmljZT8uZGV2aWNlSWQ7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgc29tZSBhY3Rpb25zIGJlZm9yZSBkZXN0cm95IHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBhc3luYyBuZ09uRGVzdHJveSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGxldCBzdHJlYW0gPSBhd2FpdCB0aGlzLmdldEFueVZpZGVvRGV2aWNlKCk7XG4gICAgdGhpcy50ZXJtaW5hdGVTdHJlYW0oc3RyZWFtKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IHZpZGVvRWwgPSB0aGlzLnByZXZpZXdFbGVtUmVmLm5hdGl2ZUVsZW1lbnRcblxuICAgICAgaWYgKHZpZGVvRWwpIHtcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gdmlkZW9FbC5zcmNPYmplY3QgYXMgTWVkaWFTdHJlYW07XG5cbiAgICAgICAgaWYgKHN0cmVhbSkge1xuXG4gICAgICAgICAgY29uc3QgdHJhY2tzID0gc3RyZWFtLmdldFRyYWNrcygpO1xuXG4gICAgICAgICAgdHJhY2tzLmZvckVhY2goZnVuY3Rpb24odHJhY2spIHtcbiAgICAgICAgICAgIHRyYWNrLnN0b3AoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZpZGVvRWwuc3JjT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTm8gc3RyZWFtIGF2YWlsYWJsZScsIHt2aWRlb0VsfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ05vIHZpZGVvIHN0cmVhbScsIHt2aWRlb0VsfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgdGhlIHNjYW5uaW5nLCBpZiBhbnkuXG4gICAqL1xuICBwdWJsaWMgc2NhblN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3NjYW5TdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuY29kZVJlYWRlcj8uZ2V0U2Nhbm5lckNvbnRyb2xzKCkuc3RvcCgpO1xuICAgICAgdGhpcy5fc2NhblN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX3NjYW5TdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudG9yY2hDb21wYXRpYmxlLm5leHQoZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHRoZSBzY2FubmluZywgaWYgYW55LlxuICAgKi9cbiAgcHVibGljIHNjYW5TdGFydCgpIHtcblxuICAgIGlmICh0aGlzLl9zY2FuU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIGFscmVhZHkgYSBzY2FuIHByb2NjZXNzIHJ1bm5pbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9kZXZpY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGV2aWNlIGRlZmluZWQsIGNhbm5vdCBzdGFydCBzY2FuLCBwbGVhc2UgZGVmaW5lIGEgZGV2aWNlLicpO1xuICAgIH1cblxuICAgIHRoaXMuc2NhbkZyb21EZXZpY2UodGhpcy5fZGV2aWNlLmRldmljZUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBvbGQgYGNvZGVSZWFkZXJgIGFuZCBzdGFydHMgc2Nhbm5pbmcgaW4gYSBuZXcgb25lLlxuICAgKi9cbiAgcmVzdGFydCgpOiB2b2lkIHtcbiAgICAvLyBAbm90ZSBhcGVuYXMgbmVjZXNzYXJpbyBwb3IgZW5xdWFudG8gY2F1c2EgZGEgVG9yY2hcbiAgICB0aGlzLl9jb2RlUmVhZGVyID0gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcHJldkRldmljZSA9IHRoaXMuX3Jlc2V0KCk7XG5cbiAgICBpZiAoIXByZXZEZXZpY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRldmljZSA9IHByZXZEZXZpY2U7XG4gIH1cblxuICAvKipcbiAgICogRGlzY292ZXJzIGFuZCB1cGRhdGVzIGtub3duIHZpZGVvIGlucHV0IGRldmljZXMuXG4gICAqL1xuICBhc3luYyB1cGRhdGVWaWRlb0lucHV0RGV2aWNlcygpOiBQcm9taXNlPE1lZGlhRGV2aWNlSW5mb1tdPiB7XG5cbiAgICAvLyBwZXJtaXNzaW9ucyBhcmVuJ3QgbmVlZGVkIHRvIGdldCBkZXZpY2VzLCBidXQgdG8gYWNjZXNzIHRoZW0gYW5kIHRoZWlyIGluZm9cbiAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgQnJvd3NlckNvZGVSZWFkZXIubGlzdFZpZGVvSW5wdXREZXZpY2VzKCkgfHwgW107XG4gICAgY29uc3QgaGFzRGV2aWNlcyA9IGRldmljZXMgJiYgZGV2aWNlcy5sZW5ndGggPiAwO1xuXG4gICAgLy8gc3RvcmVzIGRpc2NvdmVyZWQgZGV2aWNlcyBhbmQgdXBkYXRlcyBpbmZvcm1hdGlvblxuICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KGhhc0RldmljZXMpO1xuICAgIHRoaXMuY2FtZXJhc0ZvdW5kLm5leHQoWy4uLmRldmljZXNdKTtcblxuICAgIGlmICghaGFzRGV2aWNlcykge1xuICAgICAgdGhpcy5jYW1lcmFzTm90Rm91bmQubmV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXZpY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyB0aGUgc2Nhbm5lciB3aXRoIHRoZSBiYWNrIGNhbWVyYSBvdGhlcndpc2UgdGFrZSB0aGUgbGFzdFxuICAgKiBhdmFpbGFibGUgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhdXRvc3RhcnRTY2FubmVyKGRldmljZXM6IE1lZGlhRGV2aWNlSW5mb1tdKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBjb25zdCBtYXRjaGVyID0gKHsgbGFiZWwgfSkgPT4gL2JhY2t8dHLDoXN8cmVhcnx0cmFzZWlyYXxlbnZpcm9ubWVudHxhbWJpZW50ZS9naS50ZXN0KGxhYmVsKTtcblxuICAgIC8vIHNlbGVjdCB0aGUgcmVhciBjYW1lcmEgYnkgZGVmYXVsdCwgb3RoZXJ3aXNlIHRha2UgdGhlIGxhc3QgY2FtZXJhLlxuICAgIGNvbnN0IGRldmljZSA9IGRldmljZXMuZmluZChtYXRjaGVyKSB8fCBkZXZpY2VzLnBvcCgpO1xuXG4gICAgaWYgKCFkZXZpY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW1wb3NzaWJsZSB0byBhdXRvc3RhcnQsIG5vIGlucHV0IGRldmljZXMgYXZhaWxhYmxlLicpO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuc2V0RGV2aWNlKGRldmljZSk7XG5cbiAgICB0aGlzLmRldmljZUNoYW5nZS5uZXh0KGRldmljZSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBzdWNjZXNzIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gcmVzdWx0IHRoZSBzY2FuIHJlc3VsdC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuU3VjY2VzcyhyZXN1bHQ6IFJlc3VsdCk6IHZvaWQge1xuICAgIHRoaXMuc2NhblN1Y2Nlc3MubmV4dChyZXN1bHQuZ2V0VGV4dCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIGZhaWx1cmUgZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoU2NhbkZhaWx1cmUocmVhc29uPzogRXhjZXB0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5zY2FuRmFpbHVyZS5uZXh0KHJlYXNvbik7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBlcnJvciBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIGVycm9yIHRoZSBlcnJvciB0aGluZy5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuRXJyb3IoZXJyb3I6IGFueSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zY2FuRXJyb3Iub2JzZXJ2ZXJzLnNvbWUoeCA9PiBCb29sZWFuKHgpKSkge1xuICAgICAgY29uc29sZS5lcnJvcihgenhpbmcgc2Nhbm5lciBjb21wb25lbnQ6ICR7ZXJyb3IubmFtZX1gLCBlcnJvcik7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzZSB0aGUgYChzY2FuRXJyb3IpYCBwcm9wZXJ0eSB0byBoYW5kbGUgZXJyb3JzIGxpa2UgdGhpcyEnKTtcbiAgICB9XG4gICAgdGhpcy5zY2FuRXJyb3IubmV4dChlcnJvcik7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHJlc3VsdCB0aGUgc2NhbiByZXN1bHQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoU2NhbkNvbXBsZXRlKHJlc3VsdDogUmVzdWx0KTogdm9pZCB7XG4gICAgdGhpcy5zY2FuQ29tcGxldGUubmV4dChyZXN1bHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZpbHRlcmVkIHBlcm1pc3Npb24uXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZVBlcm1pc3Npb25FeGNlcHRpb24oZXJyOiBET01FeGNlcHRpb24pOiBib29sZWFuIHtcblxuICAgIC8vIGZhaWxlZCB0byBncmFudCBwZXJtaXNzaW9uIHRvIHZpZGVvIGlucHV0XG4gICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0Vycm9yIHdoZW4gYXNraW5nIGZvciBwZXJtaXNzaW9uLicsIGVycik7XG5cbiAgICBsZXQgcGVybWlzc2lvbjogYm9vbGVhbjtcblxuICAgIHN3aXRjaCAoZXJyLm5hbWUpIHtcblxuICAgICAgLy8gdXN1YWxseSBjYXVzZWQgYnkgbm90IHNlY3VyZSBvcmlnaW5zXG4gICAgICBjYXNlICdOb3RTdXBwb3J0ZWRFcnJvcic6XG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAvLyBjb3VsZCBub3QgY2xhaW1cbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XG4gICAgICAgIC8vIGNhbid0IGNoZWNrIGRldmljZXNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyB1c2VyIGRlbmllZCBwZXJtaXNzaW9uXG4gICAgICBjYXNlICdOb3RBbGxvd2VkRXJyb3InOlxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgLy8gY2xhaW1lZCBhbmQgZGVuaWVkIHBlcm1pc3Npb25cbiAgICAgICAgcGVybWlzc2lvbiA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgaW5wdXQgZGV2aWNlcyBleGlzdHNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyB0aGUgZGV2aWNlIGhhcyBubyBhdHRhY2hlZCBpbnB1dCBkZXZpY2VzXG4gICAgICBjYXNlICdOb3RGb3VuZEVycm9yJzpcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIC8vIG5vIHBlcm1pc3Npb25zIGNsYWltZWRcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XG4gICAgICAgIC8vIGJlY2F1c2UgdGhlcmUgd2FzIG5vIGRldmljZXNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xuICAgICAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXG4gICAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoZXJyKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ05vdFJlYWRhYmxlRXJyb3InOlxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDb3VsZG5cXCd0IHJlYWQgdGhlIGRldmljZShzKVxcJ3Mgc3RyZWFtLCBpdFxcJ3MgcHJvYmFibHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwLicpO1xuICAgICAgICAvLyBubyBwZXJtaXNzaW9ucyBjbGFpbWVkXG4gICAgICAgIHBlcm1pc3Npb24gPSBudWxsO1xuICAgICAgICAvLyB0aGVyZSBhcmUgZGV2aWNlcywgd2hpY2ggSSBjb3VsZG4ndCB1c2VcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xuICAgICAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXG4gICAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoZXJyKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgJ0kgd2FzIG5vdCBhYmxlIHRvIGRlZmluZSBpZiBJIGhhdmUgcGVybWlzc2lvbnMgZm9yIGNhbWVyYSBvciBub3QuJywgZXJyKTtcbiAgICAgICAgLy8gdW5rbm93blxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcbiAgICAgICAgLy8gdGhpcy5oYXNEZXZpY2VzLm5leHQodW5kZWZpbmVkO1xuICAgICAgICBicmVhaztcblxuICAgIH1cblxuICAgIHRoaXMuc2V0UGVybWlzc2lvbihwZXJtaXNzaW9uKTtcblxuICAgIC8vIHRlbGxzIHRoZSBsaXN0ZW5lciBhYm91dCB0aGUgZXJyb3JcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZS5lcnJvcihlcnIpO1xuXG4gICAgcmV0dXJuIHBlcm1pc3Npb247XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHZhbGlkIEJhcmNvZGVGb3JtYXQgb3IgZmFpbHMuXG4gICAqL1xuICBwcml2YXRlIGdldEJhcmNvZGVGb3JtYXRPckZhaWwoZm9ybWF0OiBzdHJpbmcgfCBCYXJjb2RlRm9ybWF0KTogQmFyY29kZUZvcm1hdCB7XG4gICAgcmV0dXJuIHR5cGVvZiBmb3JtYXQgPT09ICdzdHJpbmcnXG4gICAgICA/IEJhcmNvZGVGb3JtYXRbZm9ybWF0LnRyaW0oKS50b1VwcGVyQ2FzZSgpXVxuICAgICAgOiBmb3JtYXQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0b3JuYSB1bSBjb2RlIHJlYWRlciwgY3JpYSB1bSBzZSBuZW5odW1lIGV4aXN0ZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0Q29kZVJlYWRlcigpOiBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIHtcblxuICAgIGlmICghdGhpcy5fY29kZVJlYWRlcikge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgZGVsYXlCZXR3ZWVuU2NhbkF0dGVtcHRzOiB0aGlzLnRpbWVCZXR3ZWVuU2NhbnMsXG4gICAgICAgIGRlbGF5QmV0d2VlblNjYW5TdWNjZXNzOiB0aGlzLmRlbGF5QmV0d2VlblNjYW5TdWNjZXNzLFxuICAgICAgfTtcbiAgICAgIHRoaXMuX2NvZGVSZWFkZXIgPSBuZXcgQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlcih0aGlzLmhpbnRzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY29kZVJlYWRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGNvbnRpbnVvdXMgc2Nhbm5pbmcgZm9yIHRoZSBnaXZlbiBkZXZpY2UuXG4gICAqXG4gICAqIEBwYXJhbSBkZXZpY2VJZCBUaGUgZGV2aWNlSWQgZnJvbSB0aGUgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzY2FuRnJvbURldmljZShkZXZpY2VJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSB0aGlzLnByZXZpZXdFbGVtUmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBjb25zdCBjb2RlUmVhZGVyID0gdGhpcy5nZXRDb2RlUmVhZGVyKCk7XG5cbiAgICBjb25zdCBzY2FuU3RyZWFtID0gYXdhaXQgY29kZVJlYWRlci5zY2FuRnJvbURldmljZU9ic2VydmFibGUoZGV2aWNlSWQsIHZpZGVvRWxlbWVudCk7XG5cbiAgICBpZiAoIXNjYW5TdHJlYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5kZWZpbmVkIGRlY29kaW5nIHN0cmVhbSwgYWJvcnRpbmcuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9ICh4OiBSZXN1bHRBbmRFcnJvcikgPT4gdGhpcy5fb25EZWNvZGVSZXN1bHQoeC5yZXN1bHQsIHguZXJyb3IpO1xuICAgIGNvbnN0IGVycm9yID0gKGVycjogYW55KSA9PiB0aGlzLl9vbkRlY29kZUVycm9yKGVycik7XG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7IH07XG5cbiAgICB0aGlzLl9zY2FuU3Vic2NyaXB0aW9uID0gc2NhblN0cmVhbS5zdWJzY3JpYmUobmV4dCwgZXJyb3IsIGNvbXBsZXRlKTtcblxuICAgIGlmICh0aGlzLl9zY2FuU3Vic2NyaXB0aW9uLmNsb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRyb2xzID0gY29kZVJlYWRlci5nZXRTY2FubmVyQ29udHJvbHMoKTtcbiAgICBjb25zdCBoYXNUb3JjaENvbnRyb2wgPSB0eXBlb2YgY29udHJvbHMuc3dpdGNoVG9yY2ggIT09ICd1bmRlZmluZWQnO1xuXG4gICAgdGhpcy50b3JjaENvbXBhdGlibGUubmV4dChoYXNUb3JjaENvbnRyb2wpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZGVjb2RlIGVycm9ycy5cbiAgICovXG4gIHByaXZhdGUgX29uRGVjb2RlRXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLmRpc3BhdGNoU2NhbkVycm9yKGVycik7XG4gICAgLy8gdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZGVjb2RlIHJlc3VsdHMuXG4gICAqL1xuICBwcml2YXRlIF9vbkRlY29kZVJlc3VsdChyZXN1bHQ6IFJlc3VsdCwgZXJyb3I6IEV4Y2VwdGlvbik6IHZvaWQge1xuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgdGhpcy5kaXNwYXRjaFNjYW5TdWNjZXNzKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hTY2FuRmFpbHVyZShlcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaFNjYW5Db21wbGV0ZShyZXN1bHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHRoZSBjb2RlIHJlYWRlciBhbmQgcmV0dXJucyB0aGUgcHJldmlvdXMgc2VsZWN0ZWQgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKTogTWVkaWFEZXZpY2VJbmZvIHtcblxuICAgIGlmICghdGhpcy5fY29kZVJlYWRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuX2RldmljZTtcbiAgICAvLyBkbyBub3Qgc2V0IHRoaXMuZGV2aWNlIGluc2lkZSB0aGlzIG1ldGhvZCwgaXQgd291bGQgY3JlYXRlIGEgcmVjdXJzaXZlIGxvb3BcbiAgICB0aGlzLmRldmljZSA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMuX2NvZGVSZWFkZXIgPSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gZGV2aWNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgc2Nhbm5lciBhbmQgZW1pdHMgZGV2aWNlIGNoYW5nZS5cbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZGV2aWNlQ2hhbmdlLmVtaXQobnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBkZXZpY2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNldERldmljZShkZXZpY2U6IE1lZGlhRGV2aWNlSW5mbyk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gaW5zdGFudGx5IHN0b3BzIHRoZSBzY2FuIGJlZm9yZSBjaGFuZ2luZyBkZXZpY2VzXG4gICAgdGhpcy5zY2FuU3RvcCgpO1xuXG4gICAgLy8gY29ycmVjdGx5IHNldHMgdGhlIG5ldyAob3Igbm9uZSkgZGV2aWNlXG4gICAgdGhpcy5fZGV2aWNlID0gZGV2aWNlIHx8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdGhpcy5fZGV2aWNlKSB7XG4gICAgICAvLyBjbGVhbnMgdGhlIHZpZGVvIGJlY2F1c2UgdXNlciByZW1vdmVkIHRoZSBkZXZpY2VcbiAgICAgIEJyb3dzZXJDb2RlUmVhZGVyLmNsZWFuVmlkZW9Tb3VyY2UodGhpcy5wcmV2aWV3RWxlbVJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBpZiBlbmFibGVkLCBzdGFydHMgc2Nhbm5pbmdcbiAgICBpZiAodGhpcy5fZW5hYmxlZCAmJiBkZXZpY2UpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2NhbkZyb21EZXZpY2UoZGV2aWNlLmRldmljZUlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGVybWlzc2lvbiB2YWx1ZSBhbmQgZW1taXRzIHRoZSBldmVudC5cbiAgICovXG4gIHByaXZhdGUgc2V0UGVybWlzc2lvbihoYXNQZXJtaXNzaW9uOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuaGFzUGVybWlzc2lvbiA9IGhhc1Blcm1pc3Npb247XG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UubmV4dChoYXNQZXJtaXNzaW9uKTtcbiAgfVxuXG59XG4iXX0=