function buildMultipartFormData(payload = {}, files = []) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, String(value));
  });

  files.forEach((file) => {
    if (!file?.buffer || !file.fieldname) return;

    formData.append(
      file.fieldname,
      new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
      file.originalname || `${file.fieldname}.bin`
    );
  });

  return formData;
}

module.exports = {
  buildMultipartFormData,
};
