import React, { useEffect, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';

// Import Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

export function SimpleUppyTest() {
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dashboardRef.current) return;

    console.log('SimpleUppyTest: Creating Uppy instance...');
    
    const uppy = new Uppy({
      debug: true,
      autoProceed: false,
    });

    console.log('SimpleUppyTest: Adding Dashboard plugin...');
    uppy.use(Dashboard, {
      target: dashboardRef.current,
      inline: true,
      height: 300,
      note: 'Simple test - drop files here',
    });

    console.log('SimpleUppyTest: Dashboard should be mounted now');

    // Check if it rendered
    setTimeout(() => {
      const dashboard = dashboardRef.current?.querySelector('.uppy-Dashboard');
      console.log('SimpleUppyTest: Dashboard element found:', !!dashboard);
      console.log('SimpleUppyTest: Container innerHTML length:', dashboardRef.current?.innerHTML.length);
      if (dashboardRef.current) {
        console.log('SimpleUppyTest: Container HTML:', dashboardRef.current.innerHTML);
      }
    }, 500);

    return () => {
      console.log('SimpleUppyTest: Destroying Uppy instance');
      uppy.destroy();
    };
  }, []);

  return (
    <div className="p-4 border border-red-500">
      <h2 className="text-lg font-bold mb-4">Simple Uppy Test</h2>
      <div 
        ref={dashboardRef} 
        className="min-h-[300px] border border-blue-500"
        style={{ backgroundColor: '#f0f0f0', minHeight: '300px' }}
      />
    </div>
  );
}
