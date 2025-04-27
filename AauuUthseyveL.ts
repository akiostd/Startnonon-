/** src/routes.ts **/
// Login handler
router.post(
  '/login',
  handler(async (req, res) => {
    // Initiate the Auth flow
    const handle = req.body?.handle
    const url = await oauthClient.authorize(handle, {
      scope: 'transition:generic',
    })
    return res.redirect(url.toString())
  })
)
