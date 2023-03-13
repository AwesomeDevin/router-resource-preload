type TRoute = string

interface IComponent {
  preload: ()=>Promise<unknown>
  loaded: boolean
}

interface ILoadMap {
  cache: Record<TRoute, boolean>
  component:  Record<string, IComponent>
  // component
}

export const loadMap: ILoadMap = {
  cache: {},
  component: {}
}