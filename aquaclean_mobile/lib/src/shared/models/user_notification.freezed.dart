// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user_notification.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$UserNotification {

 String get id; String get title; String get body; bool get isRead; DateTime get timestamp; String? get bookingId; String get type;
/// Create a copy of UserNotification
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UserNotificationCopyWith<UserNotification> get copyWith => _$UserNotificationCopyWithImpl<UserNotification>(this as UserNotification, _$identity);

  /// Serializes this UserNotification to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UserNotification&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.body, body) || other.body == body)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp)&&(identical(other.bookingId, bookingId) || other.bookingId == bookingId)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,body,isRead,timestamp,bookingId,type);

@override
String toString() {
  return 'UserNotification(id: $id, title: $title, body: $body, isRead: $isRead, timestamp: $timestamp, bookingId: $bookingId, type: $type)';
}


}

/// @nodoc
abstract mixin class $UserNotificationCopyWith<$Res>  {
  factory $UserNotificationCopyWith(UserNotification value, $Res Function(UserNotification) _then) = _$UserNotificationCopyWithImpl;
@useResult
$Res call({
 String id, String title, String body, bool isRead, DateTime timestamp, String? bookingId, String type
});




}
/// @nodoc
class _$UserNotificationCopyWithImpl<$Res>
    implements $UserNotificationCopyWith<$Res> {
  _$UserNotificationCopyWithImpl(this._self, this._then);

  final UserNotification _self;
  final $Res Function(UserNotification) _then;

/// Create a copy of UserNotification
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? body = null,Object? isRead = null,Object? timestamp = null,Object? bookingId = freezed,Object? type = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime,bookingId: freezed == bookingId ? _self.bookingId : bookingId // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [UserNotification].
extension UserNotificationPatterns on UserNotification {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _UserNotification value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _UserNotification() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _UserNotification value)  $default,){
final _that = this;
switch (_that) {
case _UserNotification():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _UserNotification value)?  $default,){
final _that = this;
switch (_that) {
case _UserNotification() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String body,  bool isRead,  DateTime timestamp,  String? bookingId,  String type)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _UserNotification() when $default != null:
return $default(_that.id,_that.title,_that.body,_that.isRead,_that.timestamp,_that.bookingId,_that.type);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String body,  bool isRead,  DateTime timestamp,  String? bookingId,  String type)  $default,) {final _that = this;
switch (_that) {
case _UserNotification():
return $default(_that.id,_that.title,_that.body,_that.isRead,_that.timestamp,_that.bookingId,_that.type);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String body,  bool isRead,  DateTime timestamp,  String? bookingId,  String type)?  $default,) {final _that = this;
switch (_that) {
case _UserNotification() when $default != null:
return $default(_that.id,_that.title,_that.body,_that.isRead,_that.timestamp,_that.bookingId,_that.type);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _UserNotification implements UserNotification {
  const _UserNotification({required this.id, required this.title, required this.body, this.isRead = false, required this.timestamp, this.bookingId, this.type = 'info'});
  factory _UserNotification.fromJson(Map<String, dynamic> json) => _$UserNotificationFromJson(json);

@override final  String id;
@override final  String title;
@override final  String body;
@override@JsonKey() final  bool isRead;
@override final  DateTime timestamp;
@override final  String? bookingId;
@override@JsonKey() final  String type;

/// Create a copy of UserNotification
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserNotificationCopyWith<_UserNotification> get copyWith => __$UserNotificationCopyWithImpl<_UserNotification>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UserNotificationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UserNotification&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.body, body) || other.body == body)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp)&&(identical(other.bookingId, bookingId) || other.bookingId == bookingId)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,body,isRead,timestamp,bookingId,type);

@override
String toString() {
  return 'UserNotification(id: $id, title: $title, body: $body, isRead: $isRead, timestamp: $timestamp, bookingId: $bookingId, type: $type)';
}


}

/// @nodoc
abstract mixin class _$UserNotificationCopyWith<$Res> implements $UserNotificationCopyWith<$Res> {
  factory _$UserNotificationCopyWith(_UserNotification value, $Res Function(_UserNotification) _then) = __$UserNotificationCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String body, bool isRead, DateTime timestamp, String? bookingId, String type
});




}
/// @nodoc
class __$UserNotificationCopyWithImpl<$Res>
    implements _$UserNotificationCopyWith<$Res> {
  __$UserNotificationCopyWithImpl(this._self, this._then);

  final _UserNotification _self;
  final $Res Function(_UserNotification) _then;

/// Create a copy of UserNotification
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? body = null,Object? isRead = null,Object? timestamp = null,Object? bookingId = freezed,Object? type = null,}) {
  return _then(_UserNotification(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime,bookingId: freezed == bookingId ? _self.bookingId : bookingId // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
