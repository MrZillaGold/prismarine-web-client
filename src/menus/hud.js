//@ts-check
const { LitElement, html, css, unsafeCSS } = require('lit')
const { showModal, miscUiState } = require('../globalState')
const { options, watchValue } = require('../optionsStorage')
const { getGamemodeNumber } = require('../utils')
const { isMobile } = require('./components/common')

export const guiIcons1_17_1 = require('minecraft-assets/minecraft-assets/data/1.17.1/gui/icons.png')
export const guiIcons1_16_4 = require('minecraft-assets/minecraft-assets/data/1.16.4/gui/icons.png')

class Hud extends LitElement {
  firstUpdated () {
    this.isReady = true
    window.dispatchEvent(new CustomEvent('hud-ready', { detail: this }))
  }

  static get styles () {
    return css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: -2;
        width: 100%;
        height: 100vh;
        touch-action: none;
      }

      .crosshair {
        width: 16px;
        height: 16px;
        background: url('${unsafeCSS(guiIcons1_17_1)}');
        background-size: 256px;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
      }

      #xp-label {
        position: fixed;
        top: -8px;
        left: 50%;
        transform: translate(-50%);
        font-size: 10px;
        font-family: minecraft, mojangles, monospace;
        color: rgb(30, 250, 30);
        text-shadow: 0px -1px #000, 0px 1px #000, 1px 0px #000, -1px 0px #000;
        z-index: 10;
      }

      #xp-bar-bg {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translate(-50%);
        width: 182px;
        height: 5px;
        background-image: url('${unsafeCSS(guiIcons1_16_4)}');
        background-size: 256px;
        background-position-y: -64px;
      }

      .xp-bar {
        width: 182px;
        height: 5px;
        background-image: url('${unsafeCSS(guiIcons1_17_1)}');
        background-size: 256px;
        background-position-y: -69px;
      }

      .mobile-top-btns {
        display: none;
        flex-direction: row;
        position: fixed;
        top: 0;
        left: 50%;
        transform: translate(-50%);
        gap: 0 1px;
        z-index: 20;
      }

      .pause-btn,
      .chat-btn {
        border: none;
        outline: none;
        width: 18px;
        height: 18px;
        background-image: url('extra-textures/gui.png');
        background-size: 256px;
        background-position-x: -200px;
        background-position-y: -64px;
      }

      .chat-btn {
        background-position-y: -82px;
      }
      .debug-btn {
        background: #9c8c86;
        font-size: 8px;
        /* todo make other buttons centered */
        margin-right: 5px;
      }
    `
  }

  static get properties () {
    return {
      bot: { type: Object }
    }
  }

  /**
   * @param {import('mineflayer').Bot} bot
   */
  preload (bot) {
    const bossBars = this.shadowRoot.getElementById('bossbars-overlay')
    bossBars.bot = bot

    bossBars.init()
  }

  /**
   * @param {globalThis.THREE.Renderer} renderer
   * @param {import('mineflayer').Bot} bot
   * @param {string} host
   */
  init (renderer, bot, host) {
    const debugMenu = this.shadowRoot.querySelector('#debug-overlay')
    const playerList = this.shadowRoot.querySelector('#playerlist-overlay')
    const healthbar = this.shadowRoot.querySelector('#health-bar')
    const foodbar = this.shadowRoot.querySelector('#food-bar')
    // const breathbar = this.shadowRoot.querySelector('#breath-bar')
    const chat = this.shadowRoot.querySelector('#chat')
    const hotbar = this.shadowRoot.querySelector('#hotbar')
    const xpLabel = this.shadowRoot.querySelector('#xp-label')

    this.bot = bot
    hotbar.bot = bot
    debugMenu.bot = bot

    hotbar.init()
    chat.init(bot._client)
    playerList.init(bot, host)

    bot.on('entityHurt', (entity) => {
      if (entity !== bot.entity) return
      healthbar.onDamage()
    })

    bot.on('entityEffect', (entity, effect) => {
      if (entity !== bot.entity) return
      healthbar.effectAdded(effect)
    })

    bot.on('entityEffectEnd', (entity, effect) => {
      if (entity !== bot.entity) return
      healthbar.effectEnded(effect)
    })

    const onGameModeChange = () => {
      const gamemode = getGamemodeNumber(bot)
      healthbar.gameModeChanged(gamemode, bot.game.hardcore)
      foodbar.gameModeChanged(gamemode)
      // breathbar.gameModeChanged(gamemode)
      const creativeLike = gamemode === 1 || gamemode === 3
      this.shadowRoot.querySelector('#xp-bar-bg').style.display = creativeLike ? 'none' : 'block'
    }
    bot.on('game', onGameModeChange)
    onGameModeChange()

    const onHealthUpdate = () => {
      healthbar.updateHealth(bot.health, true)
      foodbar.updateHunger(bot.food, true)
    }
    bot.on('health', onHealthUpdate)
    onHealthUpdate()

    const onXpUpdate = () => {
      // @ts-expect-error
      this.shadowRoot.querySelector('#xp-bar-bg').firstElementChild.style.width = `${182 * bot.experience.progress}px`
      xpLabel.innerHTML = String(bot.experience.level)
      xpLabel.style.display = bot.experience.level > 0 ? 'block' : 'none'
    }
    bot.on('experience', onXpUpdate)
    onXpUpdate()

    // bot.on('breath', () => {
    //   breathbar.updateOxygen(bot.oxygenLevel)
    // })

    // TODO
    // breathbar.updateOxygen(bot.oxygenLevel ?? 20)

    watchValue(options, (o) => {
      miscUiState.currentTouch = o.alwaysShowMobileControls || isMobile()
      this.showMobileControls(miscUiState.currentTouch)
    })
  }

  /** @param {boolean} bl */
  showMobileControls (bl) {
    this.shadowRoot.querySelector('#mobile-top').style.display = bl ? 'flex' : 'none'
  }

  render () {
    return html`
      <div class="mobile-top-btns" id="mobile-top">
        <button class="debug-btn" @pointerdown=${(e) => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 1 }))
    }}>Select</button>
        <button class="debug-btn" @pointerdown=${(e) => {
      this.shadowRoot.getElementById('debug-overlay').showOverlay = !this.shadowRoot.getElementById('debug-overlay').showOverlay
    }}>F3</button>
        <button class="chat-btn" @pointerdown=${(e) => {
      e.stopPropagation()
      this.shadowRoot.querySelector('#chat').enableChat()
    }}></button>
        <button class="pause-btn" @pointerdown=${(e) => {
      e.stopPropagation()
      showModal(document.getElementById('pause-screen'))
    }}></button>
      </div>

      <pmui-debug-overlay id="debug-overlay"></pmui-debug-overlay>
      <pmui-playerlist-overlay id="playerlist-overlay"></pmui-playerlist-overlay>
      <pmui-bossbars-overlay id="bossbars-overlay"></pmui-bossbars-overlay>
      <div class="crosshair"></div>
      <chat-box id="chat"></chat-box>
      <!--<pmui-breathbar id="breath-bar"></pmui-breathbar>-->
      <pmui-healthbar id="health-bar"></pmui-healthbar>
      <pmui-foodbar id="food-bar"></pmui-foodbar>
      <div id="xp-bar-bg">
        <div class="xp-bar"></div>
        <span id="xp-label"></span>
      </div>
      <pmui-hotbar id="hotbar"></pmui-hotbar>
    `
  }
}

window.customElements.define('pmui-hud', Hud)
