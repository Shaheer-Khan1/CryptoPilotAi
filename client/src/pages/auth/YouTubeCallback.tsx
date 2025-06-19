import { useEffect } from 'react';
import { useLocation } from 'wouter';

const YouTubeCallback = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('youtube_oauth_state');
      let returnUrl = sessionStorage.getItem('youtube_return_url') || '/dashboard/shorts-generator';
      sessionStorage.removeItem('youtube_return_url');

      // Decode state if present
      let validState = false;
      if (state && storedState && state === storedState) {
        validState = true;
        try {
          const stateObj = JSON.parse(atob(state));
          if (stateObj.returnUrl) {
            returnUrl = stateObj.returnUrl;
          }
        } catch {}
      }

      if (!code || !state || !validState) {
        setLocation(returnUrl + '?youtube_error=invalid_state');
        return;
      }

      try {
        const response = await fetch('/api/auth/youtube/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        const data = await response.json();
        if (data.success) {
          sessionStorage.setItem('youtube_connected', 'true');
          setLocation(returnUrl + '?youtube_connected=true');
        } else {
          setLocation(returnUrl + '?youtube_error=true');
        }
      } catch (error) {
        setLocation(returnUrl + '?youtube_error=true');
      }
    };
    handleCallback();
  }, [setLocation]);

  return <div>Connecting to YouTube...</div>;
};

export default YouTubeCallback; 