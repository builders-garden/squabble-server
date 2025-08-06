// client to server
export enum ClientToServerSocketEvents {
  CONNECT_TO_LOBBY = "connect_to_lobby",
  PLAYER_READY = "player_ready",
  PLAYER_STAKE_CONFIRMED = "player_stake_confirmed",
  PLAYER_STAKE_REFUNDED = "player_stake_refunded",
  START_GAME = "start_game",
  SUBMIT_WORD = "submit_word",
  PLACE_LETTER = "place_letter",
  REMOVE_LETTER = "remove_letter",
  REFRESH_AVAILABLE_LETTERS = "refresh_available_letters",
}

// server to client
export enum ServerToClientSocketEvents {
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",
  GAME_FULL = "game_full",
  GAME_LOADING = "game_loading",
  GAME_STARTED = "game_started",
  GAME_UPDATE = "game_update",
  GAME_ENDED = "game_ended",
  REFRESHED_AVAILABLE_LETTERS = "refreshed_available_letters",
  TIMER_TICK = "timer_tick",
  LETTER_PLACED = "letter_placed",
  LETTER_REMOVED = "letter_removed",
  WORD_SUBMITTED = "word_submitted",
  WORD_NOT_VALID = "word_not_valid",
  ADJACENT_WORDS_NOT_VALID = "adjacent_words_not_valid",
  SCORE_UPDATE = "score_update",
}
