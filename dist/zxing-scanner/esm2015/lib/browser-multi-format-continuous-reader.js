import { __awaiter } from "tslib";
import { ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BehaviorSubject } from 'rxjs';
/**
 * Based on zxing-typescript BrowserCodeReader
 */
export class BrowserMultiFormatContinuousReader extends BrowserMultiFormatReader {
    /**
     * Returns the code reader scanner controls.
     */
    getScannerControls() {
        if (!this.scannerControls) {
            throw new Error('No scanning is running at the time.');
        }
        return this.scannerControls;
    }
    /**
     * Starts the decoding from the current or a new video element.
     *
     * @param deviceId The device's to be used Id
     * @param previewEl A new video element
     */
    scanFromDeviceObservable(deviceId, previewEl) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const scan$ = new BehaviorSubject({});
            let ctrls;
            try {
                ctrls = yield this.decodeFromVideoDevice(deviceId, previewEl, (result, error) => {
                    if (!error) {
                        scan$.next({ result });
                        return;
                    }
                    const errorName = error.name;
                    // stream cannot stop on fails.
                    if (
                    // scan Failure - found nothing, no error
                    errorName === NotFoundException.name ||
                        // scan Error - found the QR but got error on decoding
                        errorName === ChecksumException.name ||
                        errorName === FormatException.name ||
                        error.message.includes('No MultiFormat Readers were able to detect the code.')) {
                        scan$.next({ error });
                        return;
                    }
                    // probably fatal error
                    scan$.error(error);
                    this.scannerControls.stop();
                    this.scannerControls = undefined;
                    return;
                });
                this.scannerControls = Object.assign(Object.assign({}, ctrls), { stop() {
                        ctrls.stop();
                        scan$.complete();
                    } });
            }
            catch (e) {
                scan$.error(e);
                (_a = this.scannerControls) === null || _a === void 0 ? void 0 : _a.stop();
                this.scannerControls = undefined;
            }
            return scan$.asObservable();
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy96eGluZy1zY2FubmVyL3NyYy9saWIvYnJvd3Nlci1tdWx0aS1mb3JtYXQtY29udGludW91cy1yZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RixPQUFPLEVBQUUsd0JBQXdCLEVBQW9CLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFFLGVBQWUsRUFBYyxNQUFNLE1BQU0sQ0FBQztBQUduRDs7R0FFRztBQUNILE1BQU0sT0FBTyxrQ0FBbUMsU0FBUSx3QkFBd0I7SUFROUU7O09BRUc7SUFDSSxrQkFBa0I7UUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1NBQ3hEO1FBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNVLHdCQUF3QixDQUNuQyxRQUFpQixFQUNqQixTQUE0Qjs7O1lBRzVCLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBZSxDQUFpQixFQUFFLENBQUMsQ0FBQztZQUN0RCxJQUFJLEtBQUssQ0FBQztZQUVWLElBQUk7Z0JBQ0YsS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBRTlFLElBQUksQ0FBQyxLQUFLLEVBQUU7d0JBQ1YsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7d0JBQ3ZCLE9BQU87cUJBQ1I7b0JBRUQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFFN0IsK0JBQStCO29CQUMvQjtvQkFDRSx5Q0FBeUM7b0JBQ3pDLFNBQVMsS0FBSyxpQkFBaUIsQ0FBQyxJQUFJO3dCQUNwQyxzREFBc0Q7d0JBQ3RELFNBQVMsS0FBSyxpQkFBaUIsQ0FBQyxJQUFJO3dCQUNwQyxTQUFTLEtBQUssZUFBZSxDQUFDLElBQUk7d0JBQ2xDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHNEQUFzRCxDQUFDLEVBQzlFO3dCQUNBLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUN0QixPQUFPO3FCQUNSO29CQUVELHVCQUF1QjtvQkFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7b0JBQ2pDLE9BQU87Z0JBQ1QsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLGVBQWUsbUNBQ2YsS0FBSyxLQUNSLElBQUk7d0JBQ0YsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNiLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkIsQ0FBQyxHQUNGLENBQUM7YUFDSDtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsTUFBQSxJQUFJLENBQUMsZUFBZSwwQ0FBRSxJQUFJLEdBQUc7Z0JBQzdCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO2FBQ2xDO1lBRUQsT0FBTyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7O0tBQzdCO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGVja3N1bUV4Y2VwdGlvbiwgRm9ybWF0RXhjZXB0aW9uLCBOb3RGb3VuZEV4Y2VwdGlvbiB9IGZyb20gJ0B6eGluZy9saWJyYXJ5JztcbmltcG9ydCB7IEJyb3dzZXJNdWx0aUZvcm1hdFJlYWRlciwgSVNjYW5uZXJDb250cm9scyB9IGZyb20gJ0B6eGluZy9icm93c2VyJztcbmltcG9ydCB7IEJlaGF2aW9yU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgUmVzdWx0QW5kRXJyb3IgfSBmcm9tICcuL1Jlc3VsdEFuZEVycm9yJztcblxuLyoqXG4gKiBCYXNlZCBvbiB6eGluZy10eXBlc2NyaXB0IEJyb3dzZXJDb2RlUmVhZGVyXG4gKi9cbmV4cG9ydCBjbGFzcyBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIGV4dGVuZHMgQnJvd3Nlck11bHRpRm9ybWF0UmVhZGVyIHtcblxuICAvKipcbiAgICogQWxsb3dzIHRvIGNhbGwgc2Nhbm5lciBjb250cm9scyBBUEkgd2hpbGUgc2Nhbm5pbmcuXG4gICAqIFdpbGwgYmUgdW5kZWZpbmVkIGlmIG5vIHNjYW5uaW5nIGlzIHJ1bm5pZy5cbiAgICovXG4gIHByb3RlY3RlZCBzY2FubmVyQ29udHJvbHM6IElTY2FubmVyQ29udHJvbHM7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvZGUgcmVhZGVyIHNjYW5uZXIgY29udHJvbHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0U2Nhbm5lckNvbnRyb2xzKCk6IElTY2FubmVyQ29udHJvbHMge1xuICAgIGlmICghdGhpcy5zY2FubmVyQ29udHJvbHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc2Nhbm5pbmcgaXMgcnVubmluZyBhdCB0aGUgdGltZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2Nhbm5lckNvbnRyb2xzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyB0aGUgZGVjb2RpbmcgZnJvbSB0aGUgY3VycmVudCBvciBhIG5ldyB2aWRlbyBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZGV2aWNlSWQgVGhlIGRldmljZSdzIHRvIGJlIHVzZWQgSWRcbiAgICogQHBhcmFtIHByZXZpZXdFbCBBIG5ldyB2aWRlbyBlbGVtZW50XG4gICAqL1xuICBwdWJsaWMgYXN5bmMgc2NhbkZyb21EZXZpY2VPYnNlcnZhYmxlKFxuICAgIGRldmljZUlkPzogc3RyaW5nLFxuICAgIHByZXZpZXdFbD86IEhUTUxWaWRlb0VsZW1lbnRcbiAgKTogUHJvbWlzZTxPYnNlcnZhYmxlPFJlc3VsdEFuZEVycm9yPj4ge1xuXG4gICAgY29uc3Qgc2NhbiQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFJlc3VsdEFuZEVycm9yPih7fSk7XG4gICAgbGV0IGN0cmxzO1xuXG4gICAgdHJ5IHtcbiAgICAgIGN0cmxzID0gYXdhaXQgdGhpcy5kZWNvZGVGcm9tVmlkZW9EZXZpY2UoZGV2aWNlSWQsIHByZXZpZXdFbCwgKHJlc3VsdCwgZXJyb3IpID0+IHtcblxuICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgc2NhbiQubmV4dCh7IHJlc3VsdCB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlcnJvck5hbWUgPSBlcnJvci5uYW1lO1xuXG4gICAgICAgIC8vIHN0cmVhbSBjYW5ub3Qgc3RvcCBvbiBmYWlscy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIC8vIHNjYW4gRmFpbHVyZSAtIGZvdW5kIG5vdGhpbmcsIG5vIGVycm9yXG4gICAgICAgICAgZXJyb3JOYW1lID09PSBOb3RGb3VuZEV4Y2VwdGlvbi5uYW1lIHx8XG4gICAgICAgICAgLy8gc2NhbiBFcnJvciAtIGZvdW5kIHRoZSBRUiBidXQgZ290IGVycm9yIG9uIGRlY29kaW5nXG4gICAgICAgICAgZXJyb3JOYW1lID09PSBDaGVja3N1bUV4Y2VwdGlvbi5uYW1lIHx8XG4gICAgICAgICAgZXJyb3JOYW1lID09PSBGb3JtYXRFeGNlcHRpb24ubmFtZSB8fFxuICAgICAgICAgIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIE11bHRpRm9ybWF0IFJlYWRlcnMgd2VyZSBhYmxlIHRvIGRldGVjdCB0aGUgY29kZS4nKVxuICAgICAgICApIHtcbiAgICAgICAgICBzY2FuJC5uZXh0KHsgZXJyb3IgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcHJvYmFibHkgZmF0YWwgZXJyb3JcbiAgICAgICAgc2NhbiQuZXJyb3IoZXJyb3IpO1xuICAgICAgICB0aGlzLnNjYW5uZXJDb250cm9scy5zdG9wKCk7XG4gICAgICAgIHRoaXMuc2Nhbm5lckNvbnRyb2xzID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5zY2FubmVyQ29udHJvbHMgPSB7XG4gICAgICAgIC4uLmN0cmxzLFxuICAgICAgICBzdG9wKCkge1xuICAgICAgICAgIGN0cmxzLnN0b3AoKTtcbiAgICAgICAgICBzY2FuJC5jb21wbGV0ZSgpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBzY2FuJC5lcnJvcihlKTtcbiAgICAgIHRoaXMuc2Nhbm5lckNvbnRyb2xzPy5zdG9wKCk7XG4gICAgICB0aGlzLnNjYW5uZXJDb250cm9scyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gc2NhbiQuYXNPYnNlcnZhYmxlKCk7XG4gIH1cbn1cbiJdfQ==