use crate::error::PrizeError;
use crate::instruction::PrizeInstruction;
use crate::state::ConfigState;
use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh0_10::try_from_slice_unchecked,
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::IsInitialized,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use std::convert::TryInto;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = PrizeInstruction::unpack(instruction_data)?;
    match instruction {
        PrizeInstruction::InitConfig {
            total_prize,
            first_prize,
            second_prize,
            third_prize,
            first_account,
            second_account,
            third_account,
            is_first_claimed,
            is_second_claimed,
            is_third_claimed,
            start_time,
            end_time,
        } => init_config(
            program_id,
            accounts,
            total_prize,
            first_prize,
            second_prize,
            third_prize,
            first_account,
            second_account,
            third_account,
            is_first_claimed,
            is_second_claimed,
            is_third_claimed,
            start_time,
            end_time,
        ),
        PrizeInstruction::UpdateConfig {
            total_prize,
            first_prize,
            second_prize,
            third_prize,
            first_account,
            second_account,
            third_account,
            is_first_claimed,
            is_second_claimed,
            is_third_claimed,
            start_time,
            end_time,
        } => update_config(
            program_id,
            accounts,
            total_prize,
            first_prize,
            second_prize,
            third_prize,
            first_account,
            second_account,
            third_account,
            is_first_claimed,
            is_second_claimed,
            is_third_claimed,
            start_time,
            end_time,
        ),
        PrizeInstruction::Claim {} => claim(program_id, accounts),
        PrizeInstruction::Close {} => close(program_id, accounts),
    }
}

pub fn init_config(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    total_prize: u64,
    first_prize: u64,
    second_prize: u64,
    third_prize: u64,
    first_account: Pubkey,
    second_account: Pubkey,
    third_account: Pubkey,
    is_first_claimed: bool,
    is_second_claimed: bool,
    is_third_claimed: bool,
    start_time: u64,
    end_time: u64,
) -> ProgramResult {
    msg!("Init config");
    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !initializer.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let (pda, bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), "set-config-prize".as_bytes().as_ref()],
        program_id,
    );
    if pda != *pda_account.key {
        msg!("Invalid seeds for PDA");
        return Err(ProgramError::InvalidArgument);
    }

    if start_time > end_time {
        msg!("Start time cannot be higher than End time");
        return Err(PrizeError::InvalidTime.into());
    }

    let total_len: usize = 1 + 4 * 1 + 4 * 6 + 32 * 3;
    if total_len > 1000 {
        msg!("Data length is larger than 1000 bytes");
        return Err(PrizeError::InvalidDataLength.into());
    }

    let account_len: usize = 1000;

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            pda_account.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[
            initializer.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        &[&[
            initializer.key.as_ref(),
            "set-config-prize".as_bytes().as_ref(),
            &[bump_seed],
        ]],
    )?;

    msg!("PDA created: {}", pda);

    msg!("unpacking state account");
    let mut config_data =
        try_from_slice_unchecked::<ConfigState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    msg!("checking if config account is already initialized");
    if config_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    config_data.total_prize = total_prize;
    config_data.first_prize = first_prize;
    config_data.second_prize = second_prize;
    config_data.third_prize = third_prize;
    config_data.first_account = first_account;
    config_data.second_account = second_account;
    config_data.third_account = third_account;
    config_data.is_first_claimed = is_first_claimed;
    config_data.is_second_claimed = is_second_claimed;
    config_data.is_third_claimed = is_third_claimed;
    config_data.start_time = start_time;
    config_data.end_time = end_time;
    config_data.is_initialized = true;

    msg!("serializing account");
    config_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}

pub fn update_config(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    total_prize: u64,
    first_prize: u64,
    second_prize: u64,
    third_prize: u64,
    first_account: Pubkey,
    second_account: Pubkey,
    third_account: Pubkey,
    is_first_claimed: bool,
    is_second_claimed: bool,
    is_third_claimed: bool,
    start_time: u64,
    end_time: u64,
) -> ProgramResult {
    msg!("Updating config");

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;

    if pda_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }

    if !initializer.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("unpacking state account");
    let mut config_data =
        try_from_slice_unchecked::<ConfigState>(&pda_account.data.borrow()).unwrap();

    let (pda, _bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), "set-config-prize".as_bytes().as_ref()],
        program_id,
    );
    if pda != *pda_account.key {
        msg!("Invalid seeds for PDA");
        return Err(PrizeError::InvalidPDA.into());
    }

    msg!("checking if config account is initialized");
    if !config_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(PrizeError::UninitializedAccount.into());
    }

    if start_time > end_time {
        msg!("Start time cannot be higher than End time");
        return Err(PrizeError::InvalidTime.into());
    }

    let total_len: usize = 1 + 4 * 1 + 4 * 6 + 32 * 3;
    if total_len > 1000 {
        msg!("Data length is larger than 1000 bytes");
        return Err(PrizeError::InvalidDataLength.into());
    }

    config_data.total_prize = total_prize;
    config_data.first_prize = first_prize;
    config_data.second_prize = second_prize;
    config_data.third_prize = third_prize;
    config_data.first_account = first_account;
    config_data.second_account = second_account;
    config_data.third_account = third_account;
    config_data.is_first_claimed = is_first_claimed;
    config_data.is_second_claimed = is_second_claimed;
    config_data.is_third_claimed = is_third_claimed;
    config_data.start_time = start_time;
    config_data.end_time = end_time;

    msg!("serializing account");
    config_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}

pub fn claim(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    msg!("Claimming ...");

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_owner_account = next_account_info(account_info_iter)?;
    let claimer_account_info = next_account_info(account_info_iter)?;
    let pda_claimer_account = next_account_info(account_info_iter)?;
    let claimer_token_account_info = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let pda_program = next_account_info(account_info_iter)?;
    let prize_pool_token_account_info = next_account_info(account_info_iter)?;

    if !claimer_account_info.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    msg!("unpacking state account");
    let mut config_data =
        try_from_slice_unchecked::<ConfigState>(&pda_owner_account.data.borrow()).unwrap();

    let (owner_pda, _bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), "set-config-prize".as_bytes().as_ref()],
        program_id,
    );
    if owner_pda != *pda_owner_account.key {
        msg!("Invalid seeds for PDA");
        return Err(PrizeError::InvalidPDA.into());
    }

    msg!("checking if config account is initialized");
    if !config_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(PrizeError::UninitializedAccount.into());
    }

    // Getting clock directly
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp as u64;
    msg!(
        "Current Timestamp: {} , start_time: {}, end_time: {}",
        current_timestamp,
        config_data.start_time,
        config_data.end_time
    );

    // if current_timestamp < config_data.start_time || current_timestamp > config_data.end_time {
    //     return Err(ProgramError::BorshIoError(
    //         "Invalid time range!".to_string(),
    //     ));
    // }

    let (order, is_claimed, prize_amount) = get_prize(&claimer_account_info.key, &config_data);
    if order == 0u8 {
        msg!("Account is not a winner");
        return Err(PrizeError::NotWinner.into());
    }

    if is_claimed {
        msg!("Account claimed");
        return Err(PrizeError::Claimed.into());
    }

    if order == 1 {
        config_data.is_first_claimed = true;
    }

    if order == 2 {
        config_data.is_second_claimed = true;
    }

    if order == 3 {
        config_data.is_third_claimed = true;
    }

    /////
    let (_pda, bump_seed) = Pubkey::find_program_address(&[b"claim"], program_id);
    msg!(
        "Transfer {} token from prize pool to claimer",
        prize_amount
    );
    let transfer_token_to_claimer_ix = spl_token::instruction::transfer(
        token_program.key,
        prize_pool_token_account_info.key,
        claimer_token_account_info.key,
        &_pda,
        &[&_pda],
        prize_amount,
    )?;

    invoke_signed(
        &transfer_token_to_claimer_ix,
        &[
            claimer_account_info.clone(),
            prize_pool_token_account_info.clone(),
            claimer_token_account_info.clone(),
            pda_program.clone(),
            token_program.clone(),
        ],
        &[&[&b"claim"[..], &[bump_seed]]],
    )?;
    /////

    msg!("serializing account");
    config_data.serialize(&mut &mut pda_owner_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}

pub fn close(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    msg!("Closing program ...");

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;

    if pda_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }

    if !initializer.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let pda_account_lamports = pda_account.lamports();
    if pda_account_lamports == 0u64 {
        return Err(ProgramError::InsufficientFunds);
    }
    **pda_account.try_borrow_mut_lamports()? -= pda_account_lamports;
    **initializer.try_borrow_mut_lamports()? += pda_account_lamports;

    return Ok(());
}

fn get_prize(account: &Pubkey, config: &ConfigState) -> (u8, bool, u64) {
    if account == &config.first_account {
        return (
            1u8,
            config.is_first_claimed.clone(),
            config.first_prize.clone(),
        );
    }

    if account == &config.second_account {
        return (
            2u8,
            config.is_second_claimed.clone(),
            config.second_prize.clone(),
        );
    }

    if account == &config.third_account {
        return (
            3u8,
            config.is_third_claimed.clone(),
            config.third_prize.clone(),
        );
    }

    (0u8, false, 0u64)
}
