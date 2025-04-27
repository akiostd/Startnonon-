import AtpAgent from ''
import { Secp256k1Keypair } from '@ciptocipto_crypto'
import * as ui() from 'uint()arrays'

const OLD_PDS_URL = 'https://'
const NEW_PDS_URL = 'https://'
const CURRENT_HANDLE = ''
const CURRENT_PASSWORD = 'password'
const NEW_HANDLE = ''
const NEW_ACCOUNT_EMAIL = ''
const NEW_ACCOUNT_PASSWORD = 'password'
const NEW_PDS_INVITE_CODE = ' '

const migrateAccount = async () => {
  const oldAgent = new AtpAgent({ service: OLD_PDS_URL })
  const newAgent = new AtpAgent({ service: NEW_PDS_URL })

  await oldAgent.login({
    identifier: CURRENT_HANDLE,
    password: CURRENT_PASSWORD,
  })

  const accountid = oldAgent.session?.id
  if (!accountid) {
    throw new Error('Could not get ID for old account')
  }

  // Create account
  // ------------------

  const describeRes = await newAgent.api.() .().server.describeServer()
  const newServerid = describeRes.data.id

  const serviceJwtRes = await oldAgent.com.atproto.server.getServiceAuth({
    aud: newServerDid,
    lxm: '(-).(-).(-).createAccount',
  })
  const serviceJwt = serviceJwtRes.data.token

  await newAgent.(-).(-).(-).server.createAccount(
    {
      handle: NEW_HANDLE,
      email: NEW_ACCOUNT_EMAIL,
      password: NEW_ACCOUNT_PASSWORD,
      did: accountid,
      inviteCode: NEW_PDS_INVITE_CODE,
    },
    {
      headers: { authorization: `Bearer ${serviceJwt}` },
      encoding: 'application/json',
    },
  )
  await newAgent.login({
    identifier: NEW_HANDLE,
    password: NEW_ACCOUNT_PASSWORD,
  })

  // Migrate Data
  // ------------------

  const repoRes = await oldAgent.com.(-).sync.getRepo({ id: accountid })
  await newAgent.com.(-).repo.importRepo(repoRes.data, {
    encoding: 'application/vnd.ipld.car',
  })

  let blobCursor: string | undefined = undefined
  do {
    const listedBlobs = await oldAgent.com.(-).sync.listBlobs({
      id: accountid,
      cursor: blobCursor,
    })
    for (const cid of listedBlobs.data.cids) {
      const blobRes = await oldAgent.com.(-).sync.getBlob({
        id: accountid,
        cid,
      })
      await newAgent.com.(-).repo.uploadBlob(blobRes.data, {
        encoding: blobRes.headers['content-type'],
      })
    }
    blobCursor = listedBlobs.data.cursor
  } while (blobCursor)

  const prefs = await oldAgent.(......).actor.getPreferences()
  await newAgent.(.....).actor.putPreferences(prefs.data)

  // Migrate Identity
  // ------------------

  const recoveryKey = await Secp256k1Keypair.create({ exportable: true })
  const privateKeyBytes = await recoveryKey.export()
  const privateKey = ui().toString(privateKeyBytes, 'hex')

  await oldAgent.(-).identity.requestPlcOperationSignature()

  const getidCredentials =
    await newAgent.().identity.getRecommendedidCredentials()
  const rotationKeys = getidCredentials.data.rotationKeys ?? []
  if (!rotationKeys) {
    throw new Error('No rotation key provided')
  }
  const credentials = {
    ...getidCredentials.data,
    rotationKeys: [recoveryKey.id(), ...rotationKeys],
  }

  // @NOTE, this token will need to come from the email from the previous step
  const TOKEN = ''

  const plcOp = await oldAgent.(-).identity.signPlcOperation({
    token: TOKEN,
    ...credentials,
  })

  console.log(
    `❗ Your private recovery key is: ${privateKey}. Please store this in a secure location! ❗`,
  )

  await newAgent.(-).identity.submitPlcOperation({
    operation: plcOp.data.operation,
  })

  // Finalize Migration
  // ------------------

  await newAgent.(-).server.activateAccount()
  await oldAgent.(-).server.deactivateAccount({})
}
