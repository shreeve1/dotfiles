#!/usr/bin/env python3
"""
Base hook template for Claude Code hooks.

Provides automatic metrics collection, structured logging, and error handling.
"""

import sys
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Optional
from datetime import datetime


class BaseHook(ABC):
    """
    Abstract base class for Claude Code hooks.

    Provides:
    - Automatic metrics collection
    - Structured logging with levels
    - Graceful error handling
    - Standard execution pattern

    Subclasses must implement the execute() method.
    """

    def __init__(self, hook_name: str, log_level: str = "INFO"):
        """
        Initialize base hook.

        Args:
            hook_name: Name of the hook (e.g., "SessionStart")
            log_level: Logging level (DEBUG, INFO, WARN, ERROR)
        """
        self.hook_name = hook_name
        self.logger = self._setup_logger(log_level)

    def _setup_logger(self, log_level: str) -> logging.Logger:
        """Set up structured logging for the hook."""
        logger = logging.getLogger(f"claude.hooks.{self.hook_name}")
        logger.setLevel(getattr(logging, log_level.upper()))

        # Log to file
        log_dir = Path.home() / ".claude" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        handler = logging.FileHandler(log_dir / f"{self.hook_name.lower()}.log")
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        return logger

    @abstractmethod
    def execute(self) -> Any:
        """
        Main hook logic to be implemented by subclasses.

        Returns:
            Any result from the hook execution
        """
        pass

    def run(self) -> int:
        """
        Execute the hook with metrics collection and error handling.

        Returns:
            Exit code (0 for success, 1 for failure)
        """
        start_time = datetime.utcnow()

        try:
            self.logger.info(f"Starting {self.hook_name} hook")

            # Execute hook logic
            result = self.execute()

            # Log success metrics
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._log_metrics(duration_ms=duration_ms, success=True)

            self.logger.info(f"Completed {self.hook_name} hook successfully")
            return 0

        except Exception as e:
            # Log failure metrics
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._log_metrics(duration_ms=duration_ms, success=False, error=str(e))

            self.logger.error(f"Failed {self.hook_name} hook: {e}", exc_info=True)

            # Graceful degradation - return success unless critical
            if self._is_critical_error(e):
                return 1
            return 0

    def _log_metrics(
        self,
        duration_ms: float,
        success: bool,
        error: Optional[str] = None
    ) -> None:
        """Log execution metrics (non-blocking)."""
        try:
            from ..utils.metrics import log_metric
            log_metric(
                hook_name=self.hook_name,
                duration_ms=duration_ms,
                success=success,
                error=error
            )
        except Exception as e:
            # Don't fail hook due to metrics logging issues
            self.logger.debug(f"Failed to log metrics: {e}")

    def _is_critical_error(self, exception: Exception) -> bool:
        """
        Determine if error should cause hook to fail.

        Override in subclasses to customize error handling.

        Args:
            exception: The exception that was raised

        Returns:
            True if hook should fail (exit 1), False for graceful degradation
        """
        # By default, only fail on specific critical errors
        critical_types = (
            KeyboardInterrupt,
            SystemExit,
        )
        return isinstance(exception, critical_types)


if __name__ == "__main__":
    # Test the base hook
    class TestHook(BaseHook):
        def __init__(self):
            super().__init__(hook_name="TestHook", log_level="DEBUG")

        def execute(self):
            self.logger.info("Executing test hook logic")
            return {"status": "success"}

    # Run test
    hook = TestHook()
    exit_code = hook.run()
    print(f"Hook completed with exit code: {exit_code}")
