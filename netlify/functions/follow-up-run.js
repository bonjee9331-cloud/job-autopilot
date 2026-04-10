exports.handler = async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      ranAt: new Date().toISOString(),
      task: 'follow-up-run'
    })
  };
};
