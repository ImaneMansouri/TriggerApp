import { Dashboard } from './Pages/Dashboard.jsx'
import { Home } from './Pages/Home.jsx'
import { Log } from './Pages/Log.jsx'
import { About } from './Pages/About.jsx'
import { Setup } from './Pages/Setup.jsx'
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {

  return(
    <>
      <HashRouter>
        <Routes>
          <Route path ="/" element={<Home/>}/>
          <Route path ="/Dashboard" element={<Dashboard/>}/>
          <Route path ="/Log" element={<Log/>}/>
          <Route path ="/About" element={<About/>}/>
          <Route path ="/Setup" element={<Setup/>}/>
        </Routes>
      </HashRouter>
    </>
  );
}

export default App
