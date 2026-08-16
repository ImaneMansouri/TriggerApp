import { Home } from './Pages/Home.jsx'
import { About } from './Pages/About.jsx'
<<<<<<< HEAD
import { Login } from './Pages/Login.jsx'
import { LogEpisode } from './Pages/LogEpisode.jsx'
import { Relief } from './Pages/Relief.jsx'
import { History } from './Pages/History.jsx'
import { Profile } from './Pages/Profile.jsx'
import { Resources } from './Pages/Resources.jsx'
import { OnboardingLocation } from './Pages/Onboarding/OnboardingLocation.jsx'
import { OnboardingConditions } from './Pages/Onboarding/OnboardingConditions.jsx'
import { OnboardingBackfill } from './Pages/Onboarding/OnboardingBackfill.jsx'
import { RequireAuth } from './Components/RequireAuth.jsx'
import { RequireOnboarding } from './Components/RequireOnboarding.jsx'
=======
import { Setup } from './Pages/Setup.jsx'
>>>>>>> 1caed1dfc20a1fb20e47afeb01ddf499b496f5e3
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {

  return(
    <>
      <HashRouter>
        <Routes>
          <Route path ="/login" element={<Login/>}/>
          <Route path ="/About" element={<About/>}/>
<<<<<<< HEAD
          <Route path ="/onboarding/location" element={<RequireAuth><OnboardingLocation/></RequireAuth>}/>
          <Route path ="/onboarding/conditions" element={<RequireAuth><OnboardingConditions/></RequireAuth>}/>
          <Route path ="/onboarding/backfill" element={<RequireAuth><OnboardingBackfill/></RequireAuth>}/>
          <Route path ="/" element={<RequireAuth><RequireOnboarding><Home/></RequireOnboarding></RequireAuth>}/>
          <Route path ="/log" element={<RequireAuth><LogEpisode/></RequireAuth>}/>
          <Route path ="/relief" element={<RequireAuth><Relief/></RequireAuth>}/>
          <Route path ="/history" element={<RequireAuth><History/></RequireAuth>}/>
          <Route path ="/profile" element={<RequireAuth><Profile/></RequireAuth>}/>
          <Route path ="/resources" element={<RequireAuth><Resources/></RequireAuth>}/>
=======
          <Route path ="/Setup" element={<Setup/>}/>
>>>>>>> 1caed1dfc20a1fb20e47afeb01ddf499b496f5e3
        </Routes>
      </HashRouter>
    </>
  );
}

export default App
