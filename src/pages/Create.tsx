import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import EditorPage from './Editor';

/**
 * /criar — redirects to /editor/:pageId after triggering the create flow.
 * We just render the Editor in "new" mode (no pageId param).
 */
export default function CreatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('create_page_start');
    const plan = params.get('plan');
    // Store plan in session for later use at checkout
    if (plan) sessionStorage.setItem('selected_plan', plan);
  }, []);

  return <EditorPage />;
}
