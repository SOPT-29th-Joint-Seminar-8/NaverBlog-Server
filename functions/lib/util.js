module.exports = {
  success: (message, data) => {
    return {
      success: true,
      message,
      data,
    };
  },
  nsuccess: (message) => {
    return {
      success: true,
      message,
    };
  },
  fail: (message) => {
    return {
      success: false,
      message,
    };
  },
};
