export const successResponse = (
  res,
  statusCode = 200,
  message = "Success",
  data = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  statusCode = 500,
  message = "Internal server error",
  error = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && {
      error: error instanceof Error ? error.message : error,
    }),
  });
};