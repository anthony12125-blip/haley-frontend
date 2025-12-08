"""
BABY HALEY - USER-SPACE INTERFACE
This is NOT a chatbot. This is a USER-SPACE I/O interface.

Baby is like a terminal or shell:
- Receives user input
- Converts to system calls
- Forwards to kernel
- Returns kernel response to user

Baby has ZERO permissions:
- Cannot read/write state directly
- Cannot execute processes
- Cannot access kernel internals
- Can ONLY make system calls

Baby is NOT:
- An AI agent
- A chat interface
- A decision maker
- A router

Baby IS:
- A user-space interface
- A system call generator
- Permission-less (all operations via kernel)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from os_types.os_types import KernelRequest, SystemCall
from kernel.logic_engine import get_kernel
from typing import Dict, Any


class BabyHaley:
    """
    User-space interface to HaleyOS
    
    Baby converts user operations to system calls
    Baby has PID 1001 (user-space process)
    """
    
    def __init__(self):
        self.pid = 1001  # User-space PID
        self.kernel = get_kernel()
        
        print("[BABY] User-space interface initialized")
        print(f"[BABY] PID: {self.pid}")
        print("[BABY] Permissions: NONE (all operations via syscalls)")
    
    def handle_user_operation(
        self,
        operation: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle user operation
        Converts operation to appropriate system call
        """
        print(f"\n[BABY] User operation: {operation}")
        
        # Convert operation to system call
        syscall_type, syscall_args = self._operation_to_syscall(operation, params)
        
        # Make system call to kernel
        request = KernelRequest(
            syscall=syscall_type,
            caller_pid=self.pid,
            args=syscall_args,
            context={}
        )
        
        response = self.kernel.syscall(request)
        
        # Format response for user
        return self._format_response(response)
    
    def _operation_to_syscall(
        self,
        operation: str,
        params: Dict[str, Any]
    ) -> tuple:
        """
        Convert user operation to system call
        
        This is NOT intent classification for chat.
        This is operation → syscall mapping.
        """
        if operation == "read":
            return SystemCall.READ_STATE, {"key": params.get("key")}
        
        elif operation == "compute":
            return SystemCall.DEEP_COMPUTE, {
                "task_type": "compute",
                "input_data": params,
                "constraints": {},
                "authorization": False
            }
        
        elif operation == "exec":
            return SystemCall.EXEC_MODULE, {
                "module": params.get("module"),
                "operation": params.get("op"),
                "params": params.get("params", {})
            }
        
        elif operation == "query_registry":
            return SystemCall.QUERY_REGISTRY, {
                "query": params.get("query", "*")
            }
        
        else:
            # Unknown operation - try deep compute
            return SystemCall.DEEP_COMPUTE, {
                "task_type": "compute",
                "input_data": {"problem": operation, **params},
                "constraints": {},
                "authorization": False
            }
    
    def _format_response(self, kernel_response) -> Dict[str, Any]:
        """Format kernel response for user"""
        if kernel_response.success:
            return {
                "status": "success",
                "result": kernel_response.result,
                "state_changed": len(kernel_response.state_delta) > 0
            }
        else:
            return {
                "status": "error",
                "error_code": kernel_response.error_code,
                "error_msg": kernel_response.error_msg
            }
    
    # FORBIDDEN OPERATIONS - Baby cannot do these
    
    def _forbidden_direct_state_access(self):
        """Baby CANNOT access state directly"""
        raise PermissionError(
            "Baby has no direct state access. Use READ_STATE syscall."
        )
    
    def _forbidden_direct_process_spawn(self):
        """Baby CANNOT spawn processes"""
        raise PermissionError(
            "Baby cannot spawn processes. No SPAWN_PROCESS permission."
        )
    
    def _forbidden_direct_llm_call(self):
        """Baby CANNOT call LLMs directly"""
        raise PermissionError(
            "Baby cannot call LLMs. All LLM operations via kernel → Mama."
        )


def get_baby_interface() -> BabyHaley:
    """Get Baby interface singleton"""
    global _baby
    if '_baby' not in globals():
        _baby = BabyHaley()
    return _baby
