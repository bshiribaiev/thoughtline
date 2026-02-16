// Hybrid Local Clock timestamp for ordering ops

use serde::{Deserialize, Serialize}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Hlc {
    pub physical_time: u64,
    pub logical_counter: u64 
}

impl PartialOrd for Hlc {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Hlc {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.physical_time.cmp(&other.physical_time).then(self.logical_counter.cmp(&other.logical_counter))
    }
}