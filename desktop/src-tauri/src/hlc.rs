use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Hlc {
    pub physical_time: u64,
    pub logical_counter: u64,
}

impl PartialOrd for Hlc {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Hlc {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.physical_time
            .cmp(&other.physical_time)
            .then(self.logical_counter.cmp(&other.logical_counter))
    }
}

fn current_time_ms() -> u64 {
    chrono::Utc::now().timestamp_millis() as u64
}

const MAX_DRIFT_MS: u64 = 60_000;

#[derive(Debug, Default)]
pub struct HlcClock {
    physical_time: u64,
    logical_counter: u64,
}

impl HlcClock {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn tick(&mut self) -> Hlc {
        let now = current_time_ms();
        let prev = self.physical_time;
        self.physical_time = self.physical_time.max(now);

        if self.physical_time > prev {
            self.logical_counter = 0;
        } else {
            self.logical_counter += 1;
        }

        Hlc {
            physical_time: self.physical_time,
            logical_counter: self.logical_counter,
        }
    }

    pub fn merge(&mut self, remote: Hlc) -> Result<Hlc, String> {
        let now = current_time_ms();

        // Reject if remote clock is >60s ahead of local wall clock
        if remote.physical_time > now + MAX_DRIFT_MS {
            return Err("remote clock too far ahead".into());
        }

        let prev = self.physical_time;
        self.physical_time = now.max(remote.physical_time).max(self.physical_time);
        self.logical_counter = self.resolve_counter(prev, remote);

        Ok(Hlc {
            physical_time: self.physical_time,
            logical_counter: self.logical_counter,
        })
    }

    fn resolve_counter(&self, prev_physical_time: u64, remote: Hlc) -> u64 {
        let clock_advanced = self.physical_time > prev_physical_time;
        let remote_has_same_time = self.physical_time == remote.physical_time;

        if clock_advanced && !remote_has_same_time {
            return 0; 
        }
        if clock_advanced {
            return remote.logical_counter + 1; 
        }
        if remote_has_same_time {
            return self.logical_counter.max(remote.logical_counter) + 1;
        }

        self.logical_counter + 1 
    }
}