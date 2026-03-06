package com.xueqiu.xforyou.ui.components;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000B\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\u001a\u0016\u0010\u0004\u001a\u00020\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\b0\u0007H\u0003\u001a\u0010\u0010\t\u001a\u00020\u00052\u0006\u0010\n\u001a\u00020\u000bH\u0003\u001a(\u0010\f\u001a\u00020\u00052\u0006\u0010\r\u001a\u00020\u000e2\f\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u00050\u00102\b\b\u0002\u0010\u0011\u001a\u00020\u0012H\u0007\u001a\u0010\u0010\u0013\u001a\u00020\u000b2\u0006\u0010\u0014\u001a\u00020\u000bH\u0002\u001a\u0018\u0010\u0015\u001a\u00020\u00052\u0006\u0010\u0016\u001a\u00020\u00172\u0006\u0010\r\u001a\u00020\u000eH\u0002\"\u000e\u0010\u0000\u001a\u00020\u0001X\u0082T\u00a2\u0006\u0002\n\u0000\"\u000e\u0010\u0002\u001a\u00020\u0003X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0018"}, d2 = {"MAX_LINES_COLLAPSED", "", "TRIPLE_CLICK_TIMEOUT", "", "MediaGrid", "", "media", "", "Lcom/xueqiu/xforyou/data/model/Media;", "SourceIcon", "source", "", "TweetCard", "tweet", "Lcom/xueqiu/xforyou/data/model/Tweet;", "onTripleClick", "Lkotlin/Function0;", "modifier", "Landroidx/compose/ui/Modifier;", "formatTime", "isoTime", "openOriginalPost", "context", "Landroid/content/Context;", "app_debug"})
public final class TweetCardKt {
    private static final long TRIPLE_CLICK_TIMEOUT = 500L;
    private static final int MAX_LINES_COLLAPSED = 5;
    
    @androidx.compose.runtime.Composable()
    public static final void TweetCard(@org.jetbrains.annotations.NotNull()
    com.xueqiu.xforyou.data.model.Tweet tweet, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onTripleClick, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    /**
     * 来源图标：❄️ 雪球 或 X
     */
    @androidx.compose.runtime.Composable()
    private static final void SourceIcon(java.lang.String source) {
    }
    
    /**
     * 打开原推文/帖子
     */
    private static final void openOriginalPost(android.content.Context context, com.xueqiu.xforyou.data.model.Tweet tweet) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void MediaGrid(java.util.List<com.xueqiu.xforyou.data.model.Media> media) {
    }
    
    private static final java.lang.String formatTime(java.lang.String isoTime) {
        return null;
    }
}