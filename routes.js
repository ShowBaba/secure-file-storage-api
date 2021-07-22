const shortid = require('shortid');
const IPFS = require('ipfs-api');

const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

module.exports = (app, dbe, lms, accounts) => {
  const db = dbe.collection('file-users');
  const file = dbe.collection('file-store');

  app.get('/', (req, res) => {
    res.send(ipfs)
  })
  app.post('/register', (req, res) => {
    const { email } = req.body;
    const idd = shortid.generate()
    if (email) {
      db.findOne({ email }, (err, doc) => {
        if (doc) {
          res.status(400).json({
            status: 'fail',
            message: 'Email already registered',
          })
        } else {
          db.insertOne({ email });
          res.status(201).json({
            status: 'success',
            id: idd
          })
        }
      })
    } else {
      res.status(400).json({
        status: 'fail',
        message: 'Bad input'
      })
    }
  })

  app.post('/login', (req, res) => {
    const { email } = req.body;
    if (email) {
      db.findOne({ email }, (err, doc) => {
        if (doc) {
          res.status(200).json({
            status: 'success',
            id: doc._id,
          })
        } else {
          res.status(400).json({
            status: 'fail',
            message: 'Bad request'
          })
        }
      })
    }
  })

  app.post('/upload', async (req, res) => {
    const buffer = req.body.buffer;
    const { name, title } = req.body
    const id = shortid.generate() + shortid.generate();
    // console.log(buffer)
    if (buffer && title) {
      // upload buffer to ipfs
      const ipfsHash = await ipfs.add(buffer)
      // get hash from ipfs
      const hash = ipfsHash[0].hash;
      // upload hash value to the blockchain
      lms.sendIPFS(id, hash, {
        from: accounts[0]
      }).then((_hash, _address) => {
        file.insertOne({
          id,
          hash,
          title,
          name
        });
        res.status(201).json({
          status: 'success',
          id,
        })
      }).catch((err) => {
        res.status(500).json({
          status: 'fail',
          message: 'Error upload while uploading data'
        })
      })
    }
  })

  app.get('/access/:email', (req, res) => {
    const { email } = req.params;
    if (email) {
      db.findOne({
        email,
      }, (err, doc) => {
        if (doc) {
          const data = file.find().toArray()
          res.status(200).json({
            status: 'success',
            data,
          })
        } else {
          res.status(400).json({
            status: 'fail',
            message: 'Bad request'
          })
        }
      })
    }
  })

  app.get('/access/:email/:id', (req, res) => {
    const { id, email } = req.params;
    if (id && email) {
      db.findOne({
        email
      }, (eer, doc) => {
        if (doc) {
          lms.getHash(id, {
            from: accounts[0]
          }).then(async (hash) => {
            const data = await ipfs.files.get(hash)
            res.status(200).json({
              status: 'success',
              data,
            })
          })
        } else { 
          res.status(400).json({
            status: 'fail',
            message: 'Bad request'
          })
        }
      })
    }else { 
      res.status(400).json({
        status: 'fail',
        message: 'Bad request'
      })
    }
  })
}
