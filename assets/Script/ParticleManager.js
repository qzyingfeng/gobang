/**
 * 粒子效果管理器 - ES6+ 版本
 * 管理游戏中的粒子效果：
 * - 环境粒子（背景漂浮光点）
 * - 落子特效（金色爆发）
 * - 胜利特效（庆祝粒子）
 */

const ParticleManager = cc.Class({
    extends: cc.Component,

    onLoad() {
        this._createTextures();
    },

    _createTextures() {
        // 创建简单圆形纹理
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // 绘制圆形
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFAA';
        ctx.fill();
        
        // 将 Canvas 转换为 Image 对象
        const img = new Image();
        
        img.onload = () => {
            // 创建 Texture2D
            const texture = new cc.Texture2D();
            texture.initWithElement(img);
            
            // 创建 SpriteFrame
            const spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(texture, cc.rect(0, 0, 32, 32), false, cc.v2(0, 0), cc.size(32, 32));
            
            this.dotTexture = spriteFrame;
            this.starTexture = spriteFrame;
            
            // 纹理创建后播放环境粒子
            this.playAmbientParticles();
        };
        
        img.onerror = () => {
            cc.error("图片加载失败");
        };
        
        img.src = canvas.toDataURL('image/png');
    },

    playAmbientParticles() {
        if (!this.dotTexture) return;
        
        if (this.ambientNode && this.ambientNode.isValid) {
            this.ambientNode.destroy();
        }
        
        this.ambientNode = new cc.Node("AmbientParticles");
        this.node.addChild(this.ambientNode);
        this.ambientNode.zIndex = 1000;  // 放在最上层（用于测试）
        
        // 设置粒子节点在屏幕中央
        this.ambientNode.setPosition(0, 0);  // 父节点已经在屏幕中央，所以粒子节点位置应该是 (0, 0)
        
        const ps = this.ambientNode.addComponent(cc.ParticleSystem);
        
        ps.spriteFrame = this.dotTexture;
        
        // 配置粒子属性（减少以提升性能）
        ps.totalParticles = 15;
        ps.life = 5;
        ps.lifeVar = 2;
        ps.startSize = 15;
        ps.endSize = 8;
        ps.startColor = new cc.Color(255, 255, 200, 180);
        ps.endColor = new cc.Color(255, 255, 150, 0);
        ps.startSpeed = 20;
        ps.startSpeedVar = 10;
        ps.posVar = new cc.Vec2(150, 100);
        ps.gravity = new cc.Vec2(0, 0);
        ps.emissionRate = 3;
        ps.loop = true;
        ps.playOnLoad = true;
        
        ps.resetSystem();
        
        return ps;
    },

    playPlaceChessEffect(position) {
        if (!position) return null;
        
        if (!this.dotTexture) return null;
        
        const x = position.x !== undefined ? position.x : position.xx;
        const y = position.y !== undefined ? position.y : position.yy;
        
        // 创建波纹扩散效果 - 从中心向外扩散的圆环
        this._createRippleEffect(x, y);
        
        // 同时创建小粒子爆发效果
        this._createPlaceParticles(x, y);
    },
    
    /**
     * 创建波纹扩散效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    _createRippleEffect(x, y) {
        const rippleNode = new cc.Node("RippleEffect");
        this.node.addChild(rippleNode);
        rippleNode.setPosition(x, y);
        rippleNode.zIndex = 52;
        
        const graphics = rippleNode.addComponent(cc.Graphics);
        
        const radiusMax = 35;
        const lineWidth = 3;
        
        // 使用 easeOut 动画
        const expand1 = cc.scaleTo(0.4, 1.5).easing(cc.easeOut(2));
        const fade1 = cc.fadeTo(0.4, 0);
        
        // 绘制初始圆环
        graphics.lineWidth = lineWidth;
        graphics.strokeColor = cc.color(255, 215, 0, 200);
        graphics.circle(0, 0, radiusMax);
        graphics.stroke();
        
        // 运行动画
        rippleNode.runAction(cc.spawn(expand1, fade1));
        
        // 动画结束后销毁
        rippleNode.runAction(cc.sequence(
            cc.delayTime(0.4),
            cc.callFunc(() => {
                rippleNode.destroy();
            })
        ));
    },
    
    /**
     * 创建落子小粒子爆发
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    _createPlaceParticles(x, y) {
        const effectNode = new cc.Node("PlaceChessEffect");
        this.node.addChild(effectNode);
        effectNode.zIndex = 51;
        effectNode.setPosition(x, y);
        
        const ps = effectNode.addComponent(cc.ParticleSystem);
        
        ps.spriteFrame = this.dotTexture;
        
        // 小而快的粒子
        ps.totalParticles = 25;
        ps.life = 0.4;
        ps.lifeVar = 0.15;
        ps.startSize = 15;
        ps.endSize = 3;
        ps.startColor = new cc.Color(255, 255, 150, 255);
        ps.endColor = new cc.Color(255, 200, 50, 0);
        ps.startSpeed = 120;
        ps.startSpeedVar = 40;
        ps.posVar = new cc.Vec2(15, 15);
        ps.gravity = new cc.Vec2(0, -30);
        ps.emissionRate = 0;
        ps.loop = false;
        ps.playOnLoad = true;
        ps.autoRemoveOnFinish = true;
        
        ps.bursts = [{ time: 0, count: 12 }];
        
        ps.resetSystem();
    },

    playWinEffect(position) {
        if (!this.starTexture) return null;
        
        let x = 0, y = 0;
        if (position) {
            x = position.x !== undefined ? position.x : position.xx;
            y = position.y !== undefined ? position.y : position.yy;
        }
        
        // 只创建一个粒子系统，减少到60个粒子
        this._createWinParticleSystem(x, y, new cc.Color(255, 215, 0, 255), new cc.Color(255, 100, 0, 0), 60);
    },
    
    /**
     * 创建胜利粒子系统（内部方法）
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {cc.Color} startColor - 起始颜色
     * @param {cc.Color} endColor - 结束颜色
     * @param {number} particleCount - 粒子数量
     */
    _createWinParticleSystem(x, y, startColor, endColor, particleCount) {
        const winNode = new cc.Node("WinEffect_" + startColor.r + "_" + startColor.g);
        this.node.addChild(winNode);
        winNode.zIndex = 100;
        winNode.setPosition(x, y);
        
        const ps = winNode.addComponent(cc.ParticleSystem);
        
        ps.spriteFrame = this.starTexture;
        
        // 增强粒子参数
        ps.totalParticles = 80;
        ps.life = 1.5;
        ps.lifeVar = 0.5;
        ps.startSize = 30;
        ps.startSizeVar = 10;
        ps.endSize = 8;
        ps.startColor = startColor;
        ps.endColor = endColor;
        ps.startSpeed = 80;
        ps.startSpeedVar = 30;
        ps.posVar = new cc.Vec2(50, 50);
        ps.gravity = new cc.Vec2(0, -20);
        ps.emissionRate = 0;
        ps.loop = false;
        ps.playOnLoad = true;
        ps.autoRemoveOnFinish = true;
        
        // 关键：放在棋子下面（棋子zIndex约50，粒子放40），让粒子从棋子周围爆出来
        winNode.zIndex = 40;
        
        // 单次爆发效果（减少计算）
        ps.bursts = [
            { time: 0, count: particleCount }
        ];
        
        ps.resetSystem();
        
        return ps;
    }
});

window.ParticleManager = ParticleManager;
