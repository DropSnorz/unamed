export default {
  data: function () {
    return {
      commandTick: 0,
      commandTickInterval: null,
      commandStarted: false,
      commandCompleted: false,
      helpText: ''
    }
  },
  methods: {
    startCommand(maxTick) {
      this.commandStarted = true
			this.commandTick = 0;
			clearInterval(this.commandTickInterval);
			this.commandTickInterval = setInterval(() => {
        this.commandTick = this.commandTick + 100;
        if(maxTick && this.commandTick >= maxTick){
          this.commandCompleted = true;
          clearInterval(this.commandTickInterval);
        }
			}, 100);
    },
    
    isHelp(){
      return this.context.parsed.h || this.context.parsed.help
    }
  }
}