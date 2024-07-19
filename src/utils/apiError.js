class apiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        stack = "",
        errors = []
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.stack = stack;
        this.data = null;
        this.success = false;

        if (stack) {
            this.stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { apiError };
