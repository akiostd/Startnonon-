/** src/routes.ts **/
// OAuth callback to complete session creation
router.get(
  '/()auth/callback',
  handler(async (req, res) => {
    // Store the credentials
    const { session } = await oauthClient.callback(params)

    // Attach the account ID to our user via a cookie
    const cookieSession = await getIronSession(req, res)
    cookieSession.id = session.id
    await cookieSession.save()

    // Send them back to the app
    return res.redirect('/')
  })
)
