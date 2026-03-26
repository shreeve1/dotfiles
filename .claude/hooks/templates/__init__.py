"""
Hook templates for Claude Code.

Provides reusable base classes and mixins for common hook patterns.
"""

from .base_hook import BaseHook
from .context_injection import ContextInjectionMixin
from .audit_logger import AuditLoggerMixin

__all__ = [
    "BaseHook",
    "ContextInjectionMixin",
    "AuditLoggerMixin",
]
