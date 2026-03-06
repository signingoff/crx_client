package com.xueqiu.xforyou.ui.settings;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\f\n\u0002\u0010\u0002\n\u0002\b\u000e\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u000e\u0010\u001e\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u0007J\u000e\u0010!\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u0007J\u0006\u0010\"\u001a\u00020\u001fJ\u0006\u0010#\u001a\u00020\u001fJ\u000e\u0010$\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u0007J\u000e\u0010%\u001a\u00020\u001f2\u0006\u0010 \u001a\u00020\u0007J\u0006\u0010&\u001a\u00020\u001fJ\u0006\u0010\'\u001a\u00020\u001fJ\u0006\u0010(\u001a\u00020\u001fJ\u0006\u0010)\u001a\u00020\u001fJ\u0016\u0010*\u001a\u00020\u001f2\u0006\u0010+\u001a\u00020\u00072\u0006\u0010,\u001a\u00020\u0007R\u0016\u0010\u0005\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\b\u001a\b\u0012\u0004\u0012\u00020\t0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u000b0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0016\u0010\f\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\r\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000f0\u000e0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001a\u0010\u0010\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000f0\u000e0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0019\u0010\u0011\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0017\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\t0\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0014R\u0019\u0010\u0016\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u000b0\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0014R\u0019\u0010\u0018\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u0014R\u001d\u0010\u001a\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000f0\u000e0\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001b\u0010\u0014R\u001d\u0010\u001c\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000f0\u000e0\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u0014\u00a8\u0006-"}, d2 = {"Lcom/xueqiu/xforyou/ui/settings/UserManagementViewModel;", "Landroidx/lifecycle/ViewModel;", "apiService", "Lcom/xueqiu/xforyou/data/api/ApiService;", "(Lcom/xueqiu/xforyou/data/api/ApiService;)V", "_error", "Landroidx/compose/runtime/MutableState;", "", "_isLoading", "", "_queryIdConfig", "Lcom/xueqiu/xforyou/data/model/QueryIdConfig;", "_successMessage", "_twitterUsers", "", "Lcom/xueqiu/xforyou/data/model/MonitorUser;", "_xueqiuUsers", "error", "Landroidx/compose/runtime/State;", "getError", "()Landroidx/compose/runtime/State;", "isLoading", "queryIdConfig", "getQueryIdConfig", "successMessage", "getSuccessMessage", "twitterUsers", "getTwitterUsers", "xueqiuUsers", "getXueqiuUsers", "addTwitterUser", "", "userId", "addXueqiuUser", "clearError", "clearSuccessMessage", "deleteTwitterUser", "deleteXueqiuUser", "loadAllData", "loadQueryIdConfig", "loadTwitterUsers", "loadXueqiuUsers", "updateQueryId", "type", "queryId", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class UserManagementViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.xueqiu.xforyou.data.api.ApiService apiService = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> _twitterUsers = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> twitterUsers = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> _xueqiuUsers = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> xueqiuUsers = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<com.xueqiu.xforyou.data.model.QueryIdConfig> _queryIdConfig = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<com.xueqiu.xforyou.data.model.QueryIdConfig> queryIdConfig = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<java.lang.Boolean> _isLoading = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<java.lang.Boolean> isLoading = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<java.lang.String> _error = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<java.lang.String> error = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.MutableState<java.lang.String> _successMessage = null;
    @org.jetbrains.annotations.NotNull()
    private final androidx.compose.runtime.State<java.lang.String> successMessage = null;
    
    @javax.inject.Inject()
    public UserManagementViewModel(@org.jetbrains.annotations.NotNull()
    com.xueqiu.xforyou.data.api.ApiService apiService) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> getTwitterUsers() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<java.util.List<com.xueqiu.xforyou.data.model.MonitorUser>> getXueqiuUsers() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<com.xueqiu.xforyou.data.model.QueryIdConfig> getQueryIdConfig() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<java.lang.Boolean> isLoading() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<java.lang.String> getError() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.runtime.State<java.lang.String> getSuccessMessage() {
        return null;
    }
    
    public final void loadAllData() {
    }
    
    public final void loadTwitterUsers() {
    }
    
    public final void loadXueqiuUsers() {
    }
    
    public final void loadQueryIdConfig() {
    }
    
    public final void addTwitterUser(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void addXueqiuUser(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void deleteTwitterUser(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void deleteXueqiuUser(@org.jetbrains.annotations.NotNull()
    java.lang.String userId) {
    }
    
    public final void updateQueryId(@org.jetbrains.annotations.NotNull()
    java.lang.String type, @org.jetbrains.annotations.NotNull()
    java.lang.String queryId) {
    }
    
    public final void clearError() {
    }
    
    public final void clearSuccessMessage() {
    }
}