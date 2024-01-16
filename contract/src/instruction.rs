use borsh::BorshDeserialize;
use solana_program::program_error::ProgramError;

pub enum TokenSaleInstruction {
    InitTokenSale {
        total_sale_token: u64,
        price: u64,
        start_time: u64,
        end_time: u64,
    },
    BuyToken {
        sol_amount: u64,
    },
    EndTokenSale {},
}

#[derive(BorshDeserialize)]
struct InitTokenSalePayload {
    total_sale_token: u64,
    price: u64,
    start_time: u64,
    end_time: u64,
}

#[derive(BorshDeserialize)]
struct BuyTokenPayload {
    sol_amount: u64,
}

impl TokenSaleInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        // Split the first byte of data
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        // Match the first byte and return the AddMovieReview struct
        Ok(match variant {
            0 => {
                let payload = InitTokenSalePayload::try_from_slice(rest).unwrap();
                Self::InitTokenSale {
                    total_sale_token: payload.total_sale_token,
                    price: payload.price,
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                }
            }
            1 => {
                let payload = BuyTokenPayload::try_from_slice(rest).unwrap();
                Self::BuyToken {
                    sol_amount: payload.sol_amount,
                }
            }
            2 => Self::EndTokenSale {},
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}
