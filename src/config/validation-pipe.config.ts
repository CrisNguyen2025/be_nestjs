import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

export function validationPipeRules(): ValidationPipe {
  const options: ValidationPipeOptions = {
    // Security and conversion rules
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    forbidUnknownValues: true,

    // Validation rules
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,

    stopAtFirstError: false,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,

    exceptionFactory: (errors) => {
      let customErrors = errors.flatMap((err) => {
        const constraints = err.constraints ?? {};

        const messages = Object.entries(constraints).map(([key, message]) => ({
          field: err.property,
          message,
          key,
        }));

        // prioritize isNotEmpty
        const hasIsNotEmpty = messages.find((m) => m.key === 'isNotEmpty');
        if (hasIsNotEmpty) return [hasIsNotEmpty];

        // if dont have isNotEmpty → first error
        return [messages[0]];
      });

      // ❗ remove whitelistValidation empty feild ("")
      customErrors = customErrors.filter((e) => {
        if (
          e.key === 'whitelistValidation' &&
          (!e.field || e.field.trim() === '')
        ) {
          return false;
        }
        return true;
      });

      return new BadRequestException(customErrors);
    },
  };

  return new ValidationPipe(options);
}
