use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct TokenSaleProgramData {
    pub is_initialized: bool,
    pub seller_pubkey: Pubkey,
    pub ido_token_account_pubkey: Pubkey,
    pub total_sale_token_amount: u64,
    pub price: u64,
    pub start_time: u64,
    pub end_time: u64,
}

impl TokenSaleProgramData {
    pub fn init(
        &mut self,
        is_initialized: bool,             // 1
        seller_pubkey: Pubkey,            // 32
        ido_token_account_pubkey: Pubkey, // 32
        total_sale_token_amount: u64,
        price: u64,
        start_time: u64,
        end_time: u64,
    ) {
        self.is_initialized = is_initialized;
        self.seller_pubkey = seller_pubkey;
        self.ido_token_account_pubkey = ido_token_account_pubkey;
        self.total_sale_token_amount = total_sale_token_amount;
        self.price = price;
        self.start_time = start_time;
        self.end_time = end_time;
    }
}

impl Sealed for TokenSaleProgramData {}

impl IsInitialized for TokenSaleProgramData {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for TokenSaleProgramData {
    const LEN: usize = 1 + 2 * 32 + 4 * 8; // 1 + 32 + 32 + 8 + 8 + 8
    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, TokenSaleProgramData::LEN];
        let (
            is_initialized,
            seller_pubkey,
            ido_token_account_pubkey,
            total_sale_token_amount,
            price,
            start_time,
            end_time,
        ) = array_refs![src, 1, 32, 32, 8, 8, 8, 8];

        let is_initialized = match is_initialized {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        return Ok(TokenSaleProgramData {
            is_initialized,
            seller_pubkey: Pubkey::new_from_array(*seller_pubkey),
            ido_token_account_pubkey: Pubkey::new_from_array(*ido_token_account_pubkey),
            total_sale_token_amount: u64::from_le_bytes(*total_sale_token_amount),
            price: u64::from_le_bytes(*price),
            start_time: u64::from_le_bytes(*start_time),
            end_time: u64::from_le_bytes(*end_time),
        });
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let dst = array_mut_ref![dst, 0, TokenSaleProgramData::LEN];
        let (
            is_initialized_dst,
            seller_pubkey_dst,
            ido_token_account_pubkey_dst,
            total_sale_token_amount_dst,
            price_dst,
            start_time_dst,
            end_time_dst,
        ) = mut_array_refs![dst, 1, 32, 32, 8, 8, 8, 8];

        let TokenSaleProgramData {
            is_initialized,
            seller_pubkey,
            ido_token_account_pubkey,
            total_sale_token_amount,
            price,
            start_time,
            end_time,
        } = self;

        is_initialized_dst[0] = *is_initialized as u8;
        seller_pubkey_dst.copy_from_slice(seller_pubkey.as_ref());
        ido_token_account_pubkey_dst.copy_from_slice(ido_token_account_pubkey.as_ref());
        *total_sale_token_amount_dst = total_sale_token_amount.to_le_bytes();
        *price_dst = price.to_le_bytes();
        *start_time_dst = start_time.to_le_bytes();
        *end_time_dst = end_time.to_le_bytes();
    }
}
