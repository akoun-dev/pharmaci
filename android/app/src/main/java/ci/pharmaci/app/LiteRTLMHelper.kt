package ci.pharmaci.app

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.LogSeverity
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.MessageCallback
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.Contents
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking

class LiteRTLMHelper(private val context: Context) {
    private var engine: Engine? = null
    private var conversation: com.google.ai.edge.litertlm.Conversation? = null
    
    companion object {
        private const val TAG = "LiteRTLMHelper"
    }
    
    init {
        Engine.setNativeMinLogSeverity(LogSeverity.ERROR)
    }
    
    fun initialize(modelPath: String, useGPU: Boolean = true): Boolean {
        return try {
            val backend = if (useGPU) Backend.GPU() else Backend.CPU()
            
            val engineConfig = EngineConfig(
                modelPath = modelPath,
                backend = backend,
                cacheDir = context.cacheDir.path
            )
            
            engine = Engine(engineConfig)
            runBlocking { 
                engine?.initialize()
            }
            
            // Create conversation with default config
            conversation = engine?.createConversation(
                ConversationConfig(
                    systemInstruction = Contents.of("You are a helpful assistant."),
                    samplerConfig = SamplerConfig(
                        topK = 40,
                        topP = 0.95f,
                        temperature = 0.8f
                    )
                )
            )
            
            Log.d(TAG, "LiteRT-LM initialized successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize LiteRT-LM: ${e.message}")
            close()
            false
        }
    }
    
    fun sendMessage(message: String, callback: MessageCallback): Boolean {
        return try {
            conversation?.sendMessageAsync(message, callback)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send message: ${e.message}")
            false
        }
    }
    
    fun sendMessageSync(message: String): String? {
        return try {
            val response = conversation?.sendMessage(message)
            response?.text
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send synchronous message: ${e.message}")
            null
        }
    }
    
    suspend fun sendMessageAsync(message: String): Flow<Message>? {
        return try {
            conversation?.sendMessageAsync(message)?.catch { e ->
                Log.e(TAG, "Error in async message: ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start async message: ${e.message}")
            null
        }
    }
    
    fun close() {
        try {
            conversation?.close()
            conversation = null
            engine?.close()
            engine = null
            Log.d(TAG, "LiteRT-LM resources released")
        } catch (e: Exception) {
            Log.e(TAG, "Error closing resources: ${e.message}")
        }
    }
    
    fun isInitialized(): Boolean {
        return engine != null && conversation != null
    }
}