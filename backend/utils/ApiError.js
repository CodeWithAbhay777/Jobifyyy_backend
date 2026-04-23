class ApiError extends Error {
    constructor(
        statusCode,
        message,
        success = false,
    ){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = success || false;
    }
    
}

export {ApiError};

