import { createElement, FunctionComponent, useEffect, useState } from 'react'

import { loadMap } from '../constant'

interface IPrams {
  loader: () => any
  loading?: FunctionComponent<any>
}

function resolve(obj: any) {
  return obj && obj.__esModule ? obj.default : obj
}

function render(target: FunctionComponent<any>, props: any) {
  return createElement(resolve(target), props)
}

export default function dynamic(params: IPrams) {
  const { loader, loading } = params

  let loaded = false
  let module: FunctionComponent<any>

  const functionStr = loader.toString()
  const matches = functionStr.match(/"(\w*)"/)
  const id = matches && matches[1] || ''

  const load = () => {
    const promise = loader()
      .then((res: FunctionComponent<any>) => {
        loaded = true
        module = res
        return res
      })
      .catch((err: string) => {
        loaded = true
        throw new Error(err)
      })
    return promise
  }


  const preload: () => Promise<FunctionComponent<any>> = () => load()

  if(id){
    loadMap.component[id] = {
      preload,
      loaded: false
    }
  }

  const Component = (props: any) => {
    const [enable, setEnable] = useState( id ? loadMap.component[id] : false)
    useEffect(() => {
      if (!loaded) {
        load().then(() => {
          setEnable(true)
        })
      } else if (!!loaded && !!module) {
        setEnable(true)
      }
    }, [loaded, module])

    return enable && module ? render(module, props) : loading ? createElement(loading) : null
  }

  return Object.assign(Component, { preload })
}
