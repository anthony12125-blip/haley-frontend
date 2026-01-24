'use client';

import { ReactNode } from 'react';
import ModuleFeedbackButton from './ModuleFeedbackButton';
import { useAuth } from '@/lib/authContext';

interface ModuleFeedbackWrapperProps {
  moduleId: string;
  moduleName: string;
  children: ReactNode;
}

/**
 * ModuleFeedbackWrapper
 * 
 * Wraps any module component and automatically adds the feedback button.
 * This ensures consistent feedback collection across all modules.
 * 
 * Usage:
 * <ModuleFeedbackWrapper moduleId="homework_solver" moduleName="Homework Solver">
 *   <HomeworkSolver onBack={goBack} />
 * </ModuleFeedbackWrapper>
 */
export default function ModuleFeedbackWrapper({ 
  moduleId, 
  moduleName, 
  children 
}: ModuleFeedbackWrapperProps) {
  const { user } = useAuth();
  
  return (
    <>
      {children}
      <ModuleFeedbackButton 
        moduleId={moduleId}
        moduleName={moduleName}
        userId={user?.uid}
      />
    </>
  );
}

/**
 * Higher-order component version for class components or when you need
 * to wrap a component without JSX
 */
export function withModuleFeedback<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleId: string,
  moduleName: string
) {
  return function WithModuleFeedback(props: P) {
    const { user } = useAuth();
    
    return (
      <>
        <WrappedComponent {...props} />
        <ModuleFeedbackButton 
          moduleId={moduleId}
          moduleName={moduleName}
          userId={user?.uid}
        />
      </>
    );
  };
}
