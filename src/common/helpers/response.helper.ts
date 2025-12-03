import { IResponse } from '../dto/response.dto';
import { ApiError } from '../dto/response.dto';

export class ResponseHelper {
  static success<T>(data: T, paging?: IResponse<T>['paging']): IResponse<T> {
    return {
      success: true,
      data,
      paging,
    };
  }

  static error(errors: ApiError[]): IResponse<null> {
    return {
      errors,
      success: false,
    };
  }
}
