import { Home } from './Pages/Home.jsx'
import { About } from './Pages/About.jsx'
import { Login } from './Pages/Login.jsx'
import { DevLogin } from './Pages/DevLogin.jsx'
import { LogEpisode } from './Pages/LogEpisode.jsx'
import { Relief } from './Pages/Relief.jsx'
import { Safety } from './Pages/Safety.jsx'
import { History } from './Pages/History.jsx'
import { EpisodeDetail } from './Pages/EpisodeDetail.jsx'
import { Patterns } from './Pages/Patterns.jsx'
import { Profile } from './Pages/Profile.jsx'
import { Resources } from './Pages/Resources.jsx'
import { OnboardingProfile } from './Pages/Onboarding/OnboardingProfile.jsx'
import { OnboardingAvatar } from './Pages/Onboarding/OnboardingAvatar.jsx'
import { OnboardingSymptoms } from './Pages/Onboarding/OnboardingSymptoms.jsx'
import { OnboardingConditions } from './Pages/Onboarding/OnboardingConditions.jsx'
import { OnboardingCapabilities } from './Pages/Onboarding/OnboardingCapabilities.jsx'
import { OnboardingLocation } from './Pages/Onboarding/OnboardingLocation.jsx'
import { RequireAuth } from './Components/RequireAuth.jsx'
import { RequireOnboarding, OnboardingRedirect } from './Components/RequireOnboarding.jsx'
import { Setup } from './Pages/Setup.jsx'
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {

  return(
    <>
      <HashRouter>
        <Routes>
          <Route path ="/login" element={<Login/>}/>
          {/* DEV-ONLY BYPASS — MUST REMOVE BEFORE DEPLOY. See src/Pages/DevLogin.jsx. */}
          <Route path ="/dev-login" element={<DevLogin/>}/>
          <Route path ="/About" element={<About/>}/>
          <Route path ="/onboarding/profile" element={<RequireAuth><OnboardingProfile/></RequireAuth>}/>
          <Route path ="/onboarding/avatar" element={<RequireAuth><OnboardingAvatar/></RequireAuth>}/>
          <Route path ="/onboarding/symptoms" element={<RequireAuth><OnboardingSymptoms/></RequireAuth>}/>
          <Route path ="/onboarding/conditions" element={<RequireAuth><OnboardingConditions/></RequireAuth>}/>
          <Route path ="/onboarding/capabilities" element={<RequireAuth><OnboardingCapabilities/></RequireAuth>}/>
          <Route path ="/onboarding/location" element={<RequireAuth><OnboardingLocation/></RequireAuth>}/>
          {/* Catches bare "/onboarding" and any unrecognized "/onboarding/*" path — without
              this, navigating there matches no route above and renders a blank page. More
              specific routes (e.g. "/onboarding/profile") still win over this splat. */}
          <Route path ="/onboarding/*" element={<RequireAuth><OnboardingRedirect/></RequireAuth>}/>
          <Route path ="/" element={<RequireAuth><RequireOnboarding><Home/></RequireOnboarding></RequireAuth>}/>
          <Route path ="/log" element={<RequireAuth><LogEpisode/></RequireAuth>}/>
          <Route path ="/relief" element={<RequireAuth><Relief/></RequireAuth>}/>
          <Route path ="/safety" element={<RequireAuth><Safety/></RequireAuth>}/>
          <Route path ="/history" element={<RequireAuth><History/></RequireAuth>}/>
          <Route path ="/history/:id" element={<RequireAuth><EpisodeDetail/></RequireAuth>}/>
          <Route path ="/patterns" element={<RequireAuth><Patterns/></RequireAuth>}/>
          <Route path ="/profile" element={<RequireAuth><Profile/></RequireAuth>}/>
          <Route path ="/resources" element={<RequireAuth><Resources/></RequireAuth>}/>
          <Route path ="/Setup" element={<Setup/>}/>
        </Routes>
      </HashRouter>
    </>
  );
}

export default App
