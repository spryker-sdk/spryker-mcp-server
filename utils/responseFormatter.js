// utils/responseFormatter.js
export const formatSuccessResponse = (data) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(data, null, 2),
    },
  ],
});

export const formatErrorResponse = (error, context = '') => ({
  content: [
    {
      type: 'text',
      text: `Error ${context ? context + ': ' : ''}${error.message}` + (error.response ? `\nResponse: ${JSON.stringify(error.response.data, null, 2)}` : ''),
    },
  ],
  isError: true,
});
