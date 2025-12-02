class MemoryStore:
    def __init__(self):
        self.sessions = {}
    
    def get_memory(self, user_id: str):
        return self.sessions.setdefault(user_id, {})

MEMORY = MemoryStore()

def os_boot():
    _ = MEMORY
    return "HaleyOS boot sequence complete (V1 MemoryStore active)."
