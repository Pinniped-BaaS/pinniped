export default function (err, req, res, next) {
  console.log(err);
  res.status(err.status || 500).json({
    message: err.message,
    detail: err.detail,
    errorCode: err.errorCode,
  });
}
