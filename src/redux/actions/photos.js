import KlaystagramContract from 'klaytn/KlaystagramContract'
import { getWallet } from 'utils/crypto'
import ui from 'utils/ui'
import { feedParser } from 'utils/misc'
import { SET_FEED } from './actionTypes'


// Action creators

const setFeed = (feed) => ({
  type: SET_FEED,
  payload: { feed },
})

const updateFeed = (tokenId) => (dispatch, getState) => {
  KlaystagramContract.methods.getPhoto(tokenId).call()
    .then((newPhoto) => {
      const { photos: { feed } } = getState()
      const newFeed = [feedParser(newPhoto), ...feed]
      dispatch(setFeed(newFeed))
    })
}

const updateOwnerAddress = (tokenId, to) => (dispatch, getState) => {
  const { photos: { feed } } = getState()
  const newFeed = feed.map((photo) => {
    if (photo[ID] !== tokenId) return photo
    photo[OWNER_HISTORY].push(to)
    return photo
  })
  dispatch(setFeed(newFeed))
}


// API functions

export const getFeed = () => (dispatch) => {
  KlaystagramContract.methods.getTotalPhotoCount().call()
    .then((totalPhotoCount) => {
      if (!totalPhotoCount) return []
      const feed = []
      for (let i = totalPhotoCount; i > 0; i--) {
        const photo = KlaystagramContract.methods.getPhoto(i).call()
        feed.push(photo)
      }
      return Promise.all(feed)
    })
    .then((feed) => dispatch(setFeed(feedParser(feed))))
}

export const uploadPhoto = (
  file,
  fileName,
  location,
  caption
) => (dispatch) => {
  const reader = new window.FileReader()
  reader.readAsArrayBuffer(file)
  reader.onloadend = async () => {
    const buffer = Buffer.from(reader.result)
    /**
     * Add prefix `0x` to hexString
     * to recognize hexString as bytes by contract
     */
    const hexString = "0x" + buffer.toString('hex')
    const receipt = await KlaystagramContract.methods.uploadPhoto(hexString, fileName, location, caption).send({
      from: getWallet().address,
      gas: '200000000',
    });

    if(receipt.transactionHash) {
      console.log(hexString);
      console.log(receipt);
      try{
      await ui.showToast({
        status: 'pending',
        message: `Sending a transaction... (uploadPhoto)`,
        txHash: receipt.transactionHash,
      })
      await ui.showToast({
        status: receipt.status ? 'success' : 'fail',
        message: `Received receipt! It means your transaction is
        in klaytn block (#${receipt.blockNumber}) (uploadPhoto)`,
        link: receipt.transactionHash,
      })
      const tokenId = receipt.events.PhotoUploaded.returnValues[0]
      dispatch(updateFeed(tokenId))
    }
    catch (error){
      ui.showToast({
        status: 'error',
        message: error.toString(),
      })
    }
    }
    /*
      .then('transactionHash', (txHash) => {
        ui.showToast({
          status: 'pending',
          message: `Sending a transaction... (uploadPhoto)`,
          txHash,
        })
      })
      */
  }
}

export const transferOwnership = (tokenId, to) => (dispatch) => {
  KlaystagramContract.methods.transferOwnership(tokenId, to).send({
    from: getWallet().address,
    gas: '20000000',
  })
    .then('transactionHash', (txHash) => {
      ui.showToast({
        status: 'pending',
        message: `Sending a transaction... (transferOwnership)`,
        txHash,
      })
    })
    .then('receipt', (receipt) => {
      ui.showToast({
        status: receipt.status ? 'success' : 'fail',
        message: `Received receipt! It means your transaction is
          in klaytn block (#${receipt.blockNumber}) (transferOwnership)`,
        link: receipt.transactionHash,
      })
      dispatch(updateOwnerAddress(tokenId, to))
    })
    .then('error', (error) => {
      ui.showToast({
        status: 'error',
        message: error.toString(),
      })
    })
}
