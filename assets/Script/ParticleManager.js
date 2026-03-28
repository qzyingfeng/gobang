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
        
        // 配置粒子属性
        ps.totalParticles = 30;
        ps.life = 5;
        ps.lifeVar = 2;
        ps.startSize = 20;
        ps.endSize = 10;
        ps.startColor = new cc.Color(255, 255, 200, 255);
        ps.endColor = new cc.Color(255, 255, 150, 0);
        ps.startSpeed = 30;
        ps.startSpeedVar = 15;
        ps.posVar = new cc.Vec2(200, 150);
        ps.gravity = new cc.Vec2(0, 0);
        ps.emissionRate = 6;
        ps.loop = true;
        ps.playOnLoad = true;
        
        ps.resetSystem();
        
        return ps;
    },

    playPlaceChessEffect(position) {
        if (!position) return null;
        
        if (!this.dotTexture) return null;
        
        const effectNode = new cc.Node("PlaceChessEffect");
        this.node.addChild(effectNode);
        effectNode.zIndex = 50;
        
        const x = position.x !== undefined ? position.x : position.xx;
        const y = position.y !== undefined ? position.y : position.yy;
        effectNode.setPosition(x, y);
        
        const ps = effectNode.addComponent(cc.ParticleSystem);
        
        ps.spriteFrame = this.dotTexture;
        
        ps.totalParticles = 20;
        ps.life = 0.5;
        ps.lifeVar = 0.2;
        ps.startSize = 25;
        ps.endSize = 5;
        ps.startColor = new cc.Color(255, 255, 100, 255);
        ps.endColor = new cc.Color(255, 200, 0, 0);
        ps.startSpeed = 150;
        ps.startSpeedVar = 50;
        ps.posVar = new cc.Vec2(20, 20);
        ps.gravity = new cc.Vec2(0, -50);
        ps.emissionRate = 0;
        ps.loop = false;
        ps.playOnLoad = true;
        ps.autoRemoveOnFinish = true;
        
        ps.bursts = [{ time: 0, count: 15 }];
        
        ps.resetSystem();
        
        return ps;
    },

    playWinEffect(position) {
        if (!this.starTexture) return null;
        
        let x = 0, y = 0;
        if (position) {
            x = position.x !== undefined ? position.x : position.xx;
            y = position.y !== undefined ? position.y : position.yy;
        }
        
        // 创建主粒子效果（金色）
        this._createWinParticleSystem(x, y, new cc.Color(255, 215, 0, 255), new cc.Color(255, 100, 0, 0), 120);
        
        // 创建辅粒子效果（橙色，更大范围）
        this._createWinParticleSystem(x, y, new cc.Color(255, 165, 0, 255), new cc.Color(255, 69, 0, 0), 80);
        
        // 创建第三个粒子效果（白色闪烁）
        this._createWinParticleSystem(x, y, new cc.Color(255, 255, 255, 255), new cc.Color(200, 200, 200, 0), 50);
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
        ps.totalParticles = particleCount;
        ps.life = 2.0;  // 延长持续时间
        ps.lifeVar = 0.8;
        ps.startSize = 35;
        ps.startSizeVar = 15;
        ps.endSize = 8;
        ps.startColor = startColor;
        ps.endColor = endColor;
        ps.startSpeed = 250;  // 增加速度
        ps.startSpeedVar = 100;
        ps.posVar = new cc.Vec2(60, 60);  // 增大扩散范围
        ps.gravity = new cc.Vec2(0, -100);
        ps.emissionRate = 0;
        ps.loop = false;
        ps.playOnLoad = true;
        ps.autoRemoveOnFinish = true;
        
        // 分批爆发效果
        ps.bursts = [
            { time: 0, count: Math.floor(particleCount * 0.4) },
            { time: 0.3, count: Math.floor(particleCount * 0.3) },
            { time: 0.6, count: Math.floor(particleCount * 0.3) }
        ];
        
        ps.resetSystem();
        
        return ps;
    }
});

window.ParticleManager = ParticleManager;
