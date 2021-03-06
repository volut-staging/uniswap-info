import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { ethers } from 'ethers'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

const WEB3 = 'web3'
const UPDATE_WEB3 = ' UPDATE_WEB3'

dayjs.extend(utc)

const AccountContext = createContext()

function useAccountContext() {
  return useContext(AccountContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE_WEB3: {
      const { web3 } = payload

      return {
        ...state,
        [WEB3]: web3
      }
    }

    default: {
      throw Error(`Unexpected action type in AccountContext reducer: '${type}'.`)
    }
  }
}

const INITIAL_STATE = {
  account: null,
  web3: {}
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const updateWeb3 = useCallback(web3 => {
    dispatch({
      type: UPDATE_WEB3,
      payload: {
        web3
      }
    })
  }, [])

  return (
    <AccountContext.Provider
      value={useMemo(
        () => [
          state,
          {
            updateWeb3
          }
        ],
        [state, updateWeb3]
      )}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccountWeb3() {
  const [state, { updateWeb3 }] = useAccountContext()
  const clearWeb3 = () => {
    updateWeb3({})
  }

  async function getWeb3() {
    const login = async address => {
      const provider = new ethers.providers.Web3Provider(window.web3.currentProvider)
      const signer = provider.getSigner()
      updateWeb3({ address, provider, signer })
    }

    const address = await window.ethereum.enable()
    login(address[0])

    window.ethereum.on('accountsChanged', async accounts => {
      login(accounts[0])
    })
  }

  const web3 = state[WEB3]
  return [web3, getWeb3, clearWeb3]
}

export function useAllAccountData() {
  const [state] = useAccountContext()
  return state
}
