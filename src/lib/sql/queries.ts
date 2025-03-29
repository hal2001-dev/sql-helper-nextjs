export const queries = {
  // 토큰 사용량 관련 쿼리
  tokenUsage: {
    insert: `
      INSERT INTO token_usage (user_id, usage_date, request_tokens, response_tokens, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, usage_date) 
      DO UPDATE SET 
        request_tokens = token_usage.request_tokens + $3,
        response_tokens = token_usage.response_tokens + $4,
        updated_at = CURRENT_TIMESTAMP;
    `,
    get: `
      SELECT request_tokens, response_tokens 
      FROM token_usage 
      WHERE user_id = $1 AND usage_date = $2;
    `
  },
  
  // 사용자 관련 쿼리
  user: {
    login: `
      SELECT * FROM users WHERE email = $1;
    `,
    signup: `
      INSERT INTO users (id, email, password, name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, name;
    `,
    getTokenLimit: `
      SELECT daily_token_limit 
      FROM users 
      WHERE email = $1;
    `
  }
}; 