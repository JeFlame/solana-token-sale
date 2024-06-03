use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum CustomError {
    #[error("invalid instruction")]
    InvalidInstruction,

    // Error 0
    #[error("Account not initialized yet")]
    UninitializedAccount,

    // Error 1
    #[error("PDA derived does not equal PDA passed in")]
    InvalidPDA,

    // Error 2
    #[error("Input data exceeds max lenght")]
    InvalidDataLength,

    // Error 3
    #[error("Rating greater than 5 or less than 1")]
    InvalidRating,

    // Error 4
    #[error(
        "An initialize config instruction was sent to an account that has already been initialized"
    )]
    ConfigAlreadyInitialized,
}

impl From<CustomError> for ProgramError {
    fn from(e: CustomError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
