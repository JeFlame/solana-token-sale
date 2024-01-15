use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::CustomError::InvalidInstruction;

pub enum TokenSaleInstruction {
    InitTokenSale {
        price: u64,
        start_time: u64,
        end_time: u64,
    },
    BuyToken {
        sol_amount: u64,
    },
    EndTokenSale {},
}

//function of enum
impl TokenSaleInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        //check instruction type
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        //unpack the rest data for each instruction
        return match tag {
            0 => Ok(Self::InitTokenSale {
                price: Self::unpack_byte(rest, 0)?,
                start_time: Self::unpack_byte(rest, 1)?,
                end_time: Self::unpack_byte(rest, 2)?,
            }),
            1 => Ok(Self::BuyToken {
                sol_amount: Self::unpack_byte(rest, 0)?,
            }),
            2 => Ok(Self::EndTokenSale {}),
            _ => Err(InvalidInstruction.into()),
        };
    }
    fn unpack_byte(input: &[u8], byte_index: usize) -> Result<u64, ProgramError> {
        let start_bit = byte_index * 8;
        let end_bit = start_bit + 8;

        let data = input
            .get(start_bit..end_bit)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        return Ok(data);
    }
}
