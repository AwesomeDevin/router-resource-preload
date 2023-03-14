import { Route, Routes as Switch, useLocation, useNavigate } from 'react-router-dom'
import A from '../components/A'
import B from '../components/B'

// import { dynamic } from 'route-resource-preload'

// console.log(dynamic)

export default function Router(){
  return <Switch>
    <Route path='*' element={<>Index</>} />
    <Route path='/A' element={<A />} />
    <Route path='/B' element={<B />} />
  </Switch>
}