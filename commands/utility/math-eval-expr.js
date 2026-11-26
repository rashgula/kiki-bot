const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

// Safe mathematical expression parser (no eval / no code injection)
function evaluateMath(expr) {
  const tokens = String(expr || '')
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .match(/(\d+(?:\.\d+)?|\*\*|[+\-*/%^()]|[a-zA-Z]+)/g);
  if (!tokens) throw new Error('Invalid expression');

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpr() {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  function parseTerm() {
    let val = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parsePower();
      if (op === '*') val *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        val /= right;
      } else val %= right;
    }
    return val;
  }

  function parsePower() {
    let base = parseUnary();
    if (peek() === '^' || peek() === '**') {
      consume();
      return Math.pow(base, parsePower());
    }
    return base;
  }

  function parseUnary() {
    if (peek() === '-') { consume(); return -parseUnary(); }
    if (peek() === '+') { consume(); return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');
    if (/^\d+(?:\.\d+)?$/.test(tok)) { consume(); return parseFloat(tok); }
    if (tok === '(') {
      consume();
      const val = parseExpr();
      if (consume() !== ')') throw new Error('Mismatched parentheses');
      return val;
    }
    if (/^[a-zA-Z]+$/.test(tok)) {
      const fn = consume().toLowerCase();
      if (fn === 'pi') return Math.PI;
      if (fn === 'e') return Math.E;
      if (consume() !== '(') throw new Error(`Expected '(' after ${fn}`);
      const arg = parseExpr();
      if (consume() !== ')') throw new Error('Mismatched parentheses');
      const map = { sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, floor: Math.floor, ceil: Math.ceil, round: Math.round };
      if (!map[fn]) throw new Error(`Unknown function: ${fn}`);
      return map[fn](arg);
    }
    throw new Error(`Unexpected token: ${tok}`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Unexpected token: ${tokens[pos]}`);
  if (!Number.isFinite(result)) throw new Error('Result is infinite or undefined');
  return Number.isInteger(result) ? result : parseFloat(result.toFixed(8));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('math-eval-expr')
    .setDescription('🧮 Evaluate a mathematical expression safely')
    .addStringOption(o => o.setName('expression').setDescription('e.g. (12 * 5) + sqrt(144)').setRequired(true)),

  aliases: ['k-math-eval-expr', 'mathevalexpr', 'math', 'calc'],
  name: 'math-eval-expr',

  async execute(interaction) {
    const expr = interaction.options.getString('expression');
    try {
      const ans = evaluateMath(expr);
      await interaction.reply({ embeds: [KikiEmbed.purple('🧮 KIKI Calculator', `**Input:** \`${expr}\`\n**Result:** \`${ans}\``)] });
    } catch (e) {
      await interaction.reply({ embeds: [KikiEmbed.error('Math Error', e.message)], ephemeral: true });
    }
  },

  async run(message, args) {
    const expr = args.join(' ');
    if (!expr) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&math (12 * 5) + sqrt(144)`')] });
    try {
      const ans = evaluateMath(expr);
      message.reply({ embeds: [KikiEmbed.purple('🧮 KIKI Calculator', `**Input:** \`${expr}\`\n**Result:** \`${ans}\``)] });
    } catch (e) {
      message.reply({ embeds: [KikiEmbed.error('Math Error', e.message)] });
    }
  }
};
